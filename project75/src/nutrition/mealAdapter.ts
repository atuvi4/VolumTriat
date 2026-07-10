import type { FoodItem, MealRecipe, ResolvedMeal } from './nutritionTypes';
import { FOODS } from './foodDatabase';

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
  const ingredients = remaining.map((i) => {
    const toG = Math.min(MAX_GRAMS, Math.max(5, round5(i.grams * f)));
    changes.push({ name: i.name, fromG: Math.round(i.grams), toG });
    return { foodId: i.foodId, grams: toG, precision: 'estimated_portion' as const };
  });

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
