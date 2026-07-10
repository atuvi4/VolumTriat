import type { MealRecipe, ResolvedMeal } from './nutritionTypes';

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

  const baseName = meal.name.replace(/\s*\(sense [^)]*\)\s*$/i, '');
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
