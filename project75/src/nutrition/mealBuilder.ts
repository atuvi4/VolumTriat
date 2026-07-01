import type {
  CalculatedNutrition,
  Confidence,
  MealIngredient,
  MealRecipe,
  NutritionSource,
  PortionLabel,
  Precision,
  ResolvedIngredient,
  ResolvedMeal,
} from './nutritionTypes';
import { DEFAULT_PORTIONS, getFood } from './foodDatabase';
import { addNutrition, calcFood, EMPTY_NUTRITION, roundNutrition } from './nutritionCalculator';
import { worstConfidence, worstPrecision } from './nutritionSources';

/** Converteix una etiqueta de ració a grams per a un aliment. */
export function portionToGrams(foodId: string, label: PortionLabel): number {
  const food = getFood(foodId);
  if (!food) return 0;
  if (food.portions && food.portions[label] != null) return food.portions[label]!;
  const cat = food.category ?? 'other';
  return DEFAULT_PORTIONS[cat]?.[label] ?? DEFAULT_PORTIONS.other[label];
}

function resolveIngredient(ing: MealIngredient): ResolvedIngredient | null {
  const food = getFood(ing.foodId);
  if (!food) return null;
  const grams = ing.grams > 0 ? ing.grams : ing.portionLabel ? portionToGrams(ing.foodId, ing.portionLabel) : 0;
  return {
    foodId: ing.foodId,
    name: food.name,
    grams,
    portionLabel: ing.portionLabel,
    precision: ing.precision,
    source: food.source,
    confidence: food.confidence,
    nutrition: roundNutrition(calcFood(food, grams)),
  };
}

/** Resol una recepta a un àpat amb nutrició CALCULADA (mai escrita a mà). */
export function resolveRecipe(recipe: MealRecipe, opts?: { id?: string; done?: boolean }): ResolvedMeal {
  const ingredients = recipe.ingredients
    .map(resolveIngredient)
    .filter((x): x is ResolvedIngredient => x !== null);

  const total: CalculatedNutrition = ingredients.reduce(
    (acc, ing) => addNutrition(acc, ing.nutrition),
    { ...EMPTY_NUTRITION },
  );

  const precisions: Precision[] = ingredients.map((i) => i.precision);
  const confidences: Confidence[] = ingredients.map((i) => i.confidence);
  const sources: NutritionSource[] = Array.from(new Set(ingredients.map((i) => i.source)));

  return {
    id: opts?.id ?? `${recipe.id}-${Date.now()}`,
    recipeId: recipe.id,
    slot: recipe.slot,
    name: recipe.name,
    done: opts?.done ?? false,
    tags: recipe.tags,
    nutrition: roundNutrition(total),
    precision: precisions.length ? worstPrecision(precisions) : 'manual_estimate',
    confidence: confidences.length ? worstConfidence(confidences) : 'low',
    sources,
    ingredients,
  };
}

/** Vista prèvia ràpida (per llistes d'alternatives). */
export function previewNutrition(recipe: MealRecipe): CalculatedNutrition {
  return resolveRecipe(recipe).nutrition;
}
