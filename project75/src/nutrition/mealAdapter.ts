import type { CalculatedNutrition, FoodItem, MealRecipe, ResolvedMeal } from './nutritionTypes';
import { FOODS, getFood } from './foodDatabase';

/* =========================================================
   Meal Adapter v1 — «no tinc plàtan»: adapta un àpat planificat traient
   l'ingredient que falta i REPUJANT proporcionalment la resta per recuperar
   les calories perdudes. La nutrició final la recalcula el motor
   (resolveRecipe) — aquí només es decideixen grams, mai números.
   Límits de seny: mai més de +75% per ingredient ni racions absurdes.
   ========================================================= */

export interface AdaptedMeal {
  recipe: MealRecipe;
  removedName: string;
  changes: { name: string; fromG: number; toG: number }[];
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
const tokens = (s: string) => norm(s).replace(/[^a-z0-9\s]+/g, ' ').split(/\s+/).filter((t) => t.length >= 3);

/** Un nom d'ingredient casa amb el que l'usuari diu que li falta?
 *  Per prefix en les dues direccions: «plàtan» ↔ «plàtans», «iogurt» ↔ «iogurt grec». */
export function ingredientMatches(ingredientName: string, missing: string): boolean {
  const ing = tokens(ingredientName);
  const miss = tokens(missing);
  return miss.some((m) => ing.some((i) => i.startsWith(m) || m.startsWith(i)));
}

const MAX_SCALE = 1.75; // mai gaire més ració del previst
const MAX_GRAMS = 800; // límit absolut de seny per ingredient
const round5 = (n: number) => Math.round(n / 5) * 5;

/* ---------- Rebost intel·ligent ----------
   Quan repujar la resta no arriba (límits de seny), es proposa AFEGIR un
   bàsic de rebost del MATEIX ROL nutricional que el que falta: mel/civada
   per energia de carbohidrats, fruits secs/cacauet per greixos, iogurt/whey
   per proteïna. Determinisme total; la nutrició la recalcula el motor. */

type Role = 'protein' | 'fat' | 'carb';

const roleOf = (kcal: number, protein: number, fat: number): Role => {
  if (kcal <= 0) return 'carb';
  if ((protein * 4) / kcal >= 0.3) return 'protein';
  if ((fat * 9) / kcal >= 0.5) return 'fat';
  return 'carb';
};
const roleOfFood = (f: FoodItem): Role => roleOf(f.kcalPer100g, f.proteinPer100g, f.fatPer100g ?? 0);
const roleOfNutrition = (n: CalculatedNutrition): Role => roleOf(n.kcal, n.protein, n.fat);

/** Bàsics de rebost (en ordre de preferència) amb límit de grams de seny. */
const PANTRY: { foodId: string; maxG: number }[] = [
  { foodId: 'honey', maxG: 40 },
  { foodId: 'oats', maxG: 80 },
  { foodId: 'milk_whole', maxG: 350 },
  { foodId: 'nuts', maxG: 50 },
  { foodId: 'peanut_butter', maxG: 40 },
  { foodId: 'greek_yogurt', maxG: 250 },
  { foodId: 'whey', maxG: 40 },
];

/** Tria un afegit de rebost per cobrir un gap de kcal (i prioritza proteïna si
 *  és el que s'ha perdut). null si el gap és petit o no hi ha candidat. */
function pantryAddition(
  gapKcal: number,
  lostProtein: number,
  removedNutrition: CalculatedNutrition,
  presentIds: Set<string>,
): { foodId: string; name: string; grams: number } | null {
  if (gapKcal < 60) return null;
  const role: Role = lostProtein >= 10 ? 'protein' : roleOfNutrition(removedNutrition);
  const candidates: { foodId: string; maxG: number; food: FoodItem }[] = [];
  for (const p of PANTRY) {
    if (presentIds.has(p.foodId)) continue;
    const food = getFood(p.foodId);
    if (food && roleOfFood(food) === role) candidates.push({ ...p, food });
  }
  if (!candidates.length) return null;
  // Preferència: el primer que cobreix ≥80% del gap dins del seu límit;
  // si cap hi arriba, el que més kcal aporta.
  const sized = candidates.map((c) => {
    const grams = Math.max(10, Math.min(c.maxG, round5((gapKcal / c.food.kcalPer100g) * 100)));
    return { c, grams, kcal: (c.food.kcalPer100g * grams) / 100 };
  });
  const covers = sized.find((s) => s.kcal >= gapKcal * 0.8);
  const pick = covers ?? sized.sort((a, b) => b.kcal - a.kcal)[0];
  return { foodId: pick.c.foodId, name: pick.c.food.name, grams: pick.grams };
}

/** Adapta l'àpat sense l'ingredient que falta. null si no el porta, si es
 *  quedaria buit, o si algun ingredient restant no és resoluble pel motor. */
export function adaptMealWithout(meal: ResolvedMeal, missing: string): AdaptedMeal | null {
  const removed = meal.ingredients.find((i) => ingredientMatches(i.name, missing));
  if (!removed) return null;

  const remaining = meal.ingredients.filter((i) => i !== removed);
  if (!remaining.length) return null; // un àpat d'un sol ingredient no s'adapta: millor alternativa
  if (remaining.some((i) => !i.foodId || i.grams <= 0)) return null; // no resoluble amb el motor

  // Factor per recuperar les kcal totals amb els ingredients que queden.
  const remainingKcal = remaining.reduce((s, i) => s + i.nutrition.kcal, 0);
  if (remainingKcal <= 0) return null;
  const f = Math.min(MAX_SCALE, Math.max(1, meal.nutrition.kcal / remainingKcal));

  const changes: AdaptedMeal['changes'] = [];
  let scaledKcal = 0;
  let scaledProt = 0;
  const ingredients = remaining.map((i) => {
    const toG = Math.min(MAX_GRAMS, Math.max(5, round5(i.grams * f)));
    changes.push({ name: i.name, fromG: Math.round(i.grams), toG });
    scaledKcal += (i.nutrition.kcal * toG) / i.grams;
    scaledProt += (i.nutrition.protein * toG) / i.grams;
    return { foodId: i.foodId, grams: toG, precision: 'estimated_portion' as const };
  });

  // Rebost intel·ligent: si repujar no arriba (límits), afegeix un bàsic del
  // mateix rol que l'ingredient que falta (p. ex. mel per un carbohidrat).
  const addition = pantryAddition(
    meal.nutrition.kcal - scaledKcal,
    meal.nutrition.protein - scaledProt,
    removed.nutrition,
    new Set(remaining.map((i) => i.foodId)),
  );
  if (addition) {
    ingredients.push({ foodId: addition.foodId, grams: addition.grams, precision: 'estimated_portion' as const });
    changes.push({ name: addition.name, fromG: 0, toG: addition.grams });
  }

  const baseName = meal.name.replace(/\s*\((sense|amb) [^)]*\)\s*$/i, '');
  return {
    recipe: {
      id: `adapt-${meal.recipeId ?? meal.id}-${Date.now()}`,
      slot: meal.slot,
      name: `${baseName} (sense ${removed.name.toLowerCase()})`,
      tags: meal.tags,
      ingredients,
    },
    removedName: removed.name,
    changes,
  };
}

/* ---------- Quantitat limitada: «només tinc 120 g de iogurt» ---------- */

const floor5 = (n: number) => Math.max(5, Math.floor(n / 5) * 5);

export type LimitResult =
  /** En té prou: la recepta en demana menys del que hi ha. Res a adaptar. */
  | { kind: 'enough'; ingredientName: string; neededG: number; haveG: number }
  | { kind: 'adapted'; recipe: MealRecipe; limitedName: string; changes: { name: string; fromG: number; toG: number }[] };

/** Retalla un ingredient al que l'usuari té i repuja la resta per recuperar
 *  les kcal perdudes (límits de seny). Nutrició final: sempre el motor. */
export function adaptMealWithLimit(meal: ResolvedMeal, ingredientQuery: string, availableGrams: number): LimitResult | null {
  if (!Number.isFinite(availableGrams) || availableGrams <= 0) return null;
  const target = meal.ingredients.find((i) => ingredientMatches(i.name, ingredientQuery));
  if (!target || !target.foodId || target.grams <= 0) return null;

  if (availableGrams >= target.grams) {
    return { kind: 'enough', ingredientName: target.name, neededG: Math.round(target.grams), haveG: Math.round(availableGrams) };
  }

  const others = meal.ingredients.filter((i) => i !== target);
  if (others.some((i) => !i.foodId || i.grams <= 0)) return null;

  const newTargetG = floor5(availableGrams); // avall: mai comptar més del que hi ha
  const lostKcal = target.nutrition.kcal * (1 - newTargetG / target.grams);
  const othersKcal = others.reduce((s, i) => s + i.nutrition.kcal, 0);
  const f = others.length && othersKcal > 0 ? Math.min(MAX_SCALE, 1 + lostKcal / othersKcal) : 1;

  const changes: { name: string; fromG: number; toG: number }[] = [
    { name: target.name, fromG: Math.round(target.grams), toG: newTargetG },
  ];
  let scaledKcal = (target.nutrition.kcal * newTargetG) / target.grams;
  let scaledProt = (target.nutrition.protein * newTargetG) / target.grams;
  const ingredients = [
    { foodId: target.foodId, grams: newTargetG, precision: 'estimated_portion' as const },
    ...others.map((i) => {
      const toG = Math.min(MAX_GRAMS, round5(i.grams * f));
      changes.push({ name: i.name, fromG: Math.round(i.grams), toG });
      scaledKcal += (i.nutrition.kcal * toG) / i.grams;
      scaledProt += (i.nutrition.protein * toG) / i.grams;
      return { foodId: i.foodId, grams: toG, precision: 'estimated_portion' as const };
    }),
  ];

  // Rebost intel·ligent: si retallar deixa el plat curt, proposa afegir un
  // bàsic del mateix rol (mel/civada, fruits secs, o iogurt/whey si falta proteïna).
  const addition = pantryAddition(
    meal.nutrition.kcal - scaledKcal,
    meal.nutrition.protein - scaledProt,
    target.nutrition,
    new Set(meal.ingredients.map((i) => i.foodId)),
  );
  if (addition) {
    ingredients.push({ foodId: addition.foodId, grams: addition.grams, precision: 'estimated_portion' as const });
    changes.push({ name: addition.name, fromG: 0, toG: addition.grams });
  }

  const baseName = meal.name.replace(/\s*\((sense|amb) [^)]*\)\s*$/i, '');
  return {
    kind: 'adapted',
    recipe: {
      id: `limit-${meal.recipeId ?? meal.id}-${Date.now()}`,
      slot: meal.slot,
      name: baseName,
      tags: meal.tags,
      ingredients,
    },
    limitedName: target.name,
    changes,
  };
}

/* ---------- Substitució de variant: «tinc iogurt normal, no el proteic» ---------- */

/** Millor aliment de la base local per a un text lliure (per encaix de tokens). */
export function findLocalFood(query: string): FoodItem | null {
  const q = tokens(query);
  if (!q.length) return null;
  let best: FoodItem | null = null;
  let bestScore = 0;
  for (const f of FOODS) {
    const name = tokens(f.name);
    const score = q.filter((m) => name.some((n) => n.startsWith(m) || m.startsWith(n))).length;
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  return best;
}

export type SubstituteResult =
  /** El pla ja compta exactament amb el que l'usuari té: res a canviar. */
  | { kind: 'already'; foodName: string; kcalPer100g: number; proteinPer100g: number }
  | { kind: 'adapted'; recipe: MealRecipe; fromName: string; toName: string; fromG: number; toG: number };

/** Substitueix un ingredient de l'àpat per la variant que l'usuari té de veritat
 *  (base local), reajustant els grams per recuperar la PROTEÏNA de l'original
 *  (prioritat de volum), dins de límits de seny. Nutrició final: el motor. */
export function substituteIngredientInMeal(meal: ResolvedMeal, have: string, insteadOf?: string): SubstituteResult | null {
  const target =
    (insteadOf && meal.ingredients.find((i) => ingredientMatches(i.name, insteadOf))) ||
    meal.ingredients.find((i) => ingredientMatches(i.name, have));
  if (!target || !target.foodId || target.grams <= 0) return null;

  const sub = findLocalFood(have);
  if (!sub) return null;
  if (sub.id === target.foodId) {
    return { kind: 'already', foodName: sub.name, kcalPer100g: sub.kcalPer100g, proteinPer100g: sub.proteinPer100g };
  }

  // Grams que recuperen la proteïna original amb la variant nova (clamp de seny).
  const ideal =
    target.nutrition.protein > 0 && sub.proteinPer100g > 0
      ? (target.nutrition.protein / sub.proteinPer100g) * 100
      : target.grams;
  const toG = Math.min(Math.min(MAX_GRAMS, target.grams * MAX_SCALE), Math.max(target.grams * 0.5, round5(ideal)));

  const baseName = meal.name.replace(/\s*\((sense|amb) [^)]*\)\s*$/i, '');
  return {
    kind: 'adapted',
    recipe: {
      id: `subst-${meal.recipeId ?? meal.id}-${Date.now()}`,
      slot: meal.slot,
      name: `${baseName} (amb ${sub.name.toLowerCase()})`,
      tags: meal.tags,
      ingredients: meal.ingredients.map((i) =>
        i === target
          ? { foodId: sub.id, grams: round5(toG), precision: 'estimated_portion' as const }
          : { foodId: i.foodId, grams: i.grams, precision: 'estimated_portion' as const },
      ),
    },
    fromName: target.name,
    toName: sub.name,
    fromG: Math.round(target.grams),
    toG: round5(toG),
  };
}
