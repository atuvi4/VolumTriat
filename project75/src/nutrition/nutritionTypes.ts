/* =========================================================
   Nutrition Engine — tipus
   Principi: cap dada es presenta com a precisa si és estimada.
   ========================================================= */

export type NutritionSource =
  | 'local_verified'
  | 'open_food_facts'
  | 'usda'
  | 'bedca'
  | 'nutritionix'
  | 'edamam'
  | 'manual_estimate'
  | 'placeholder_pending_verification';

export type Confidence = 'high' | 'medium' | 'low';

export type Precision = 'weighed' | 'estimated_portion' | 'manual_estimate';

export type PortionLabel = 'petit' | 'normal' | 'gran' | 'molt gran';

export type MealSlot = 'esmorzar' | 'dinar' | 'berenar' | 'sopar' | 'snack';

export type RecipeTag =
  | 'high_protein'
  | 'liquid_calories'
  | 'low_appetite'
  | 'no_cook'
  | 'post_workout'
  | 'pre_run'
  | 'quick'
  | 'homemade'
  | 'supplement'
  | 'outside';

/** Aliment base (valors per 100 g). */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingName?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  source: NutritionSource;
  sourceId?: string;
  confidence: Confidence;
  lastVerifiedAt?: string;
  isSupplement?: boolean;
  /** grams equivalents per etiqueta de ració (opcional; si falta, s'usa el default per categoria). */
  portions?: Partial<Record<PortionLabel, number>>;
  category?: 'carb' | 'protein' | 'dairy' | 'fat' | 'fruit' | 'legume' | 'sweetener' | 'supplement' | 'other';
}

export interface MealIngredient {
  foodId: string;
  grams: number;
  portionLabel?: PortionLabel;
  precision: Precision;
}

export interface MealRecipe {
  id: string;
  slot: MealSlot;
  name: string;
  ingredients: MealIngredient[];
  tags: RecipeTag[];
}

export interface CalculatedNutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ResolvedIngredient {
  foodId: string;
  name: string;
  grams: number;
  portionLabel?: PortionLabel;
  precision: Precision;
  source: NutritionSource;
  confidence: Confidence;
  nutrition: CalculatedNutrition;
}

/** Àpat resolt: la nutrició és SEMPRE calculada, mai escrita a mà. */
export interface ResolvedMeal {
  id: string;
  recipeId?: string;
  slot: MealSlot;
  name: string;
  done: boolean;
  tags: RecipeTag[];
  nutrition: CalculatedNutrition;
  precision: Precision; // pitjor precisió dels ingredients
  confidence: Confidence; // pitjor confiança dels ingredients
  sources: NutritionSource[]; // conjunt únic de fonts usades
  ingredients: ResolvedIngredient[];
}

/* ---------- Objectius nutricionals ---------- */
export interface NutritionTargets {
  bmr: number;
  tdeeLow: number;
  tdeeMid: number;
  tdeeHigh: number;
  kcalRange: [number, number];
  kcalStart: number;
  proteinRange: [number, number];
  proteinGrams: number;
  proteinPerKg: number;
  fatMin: number;
  carbs: number;
  weeklyGain: [number, number];
  explanation: string;
  proteinNote: string;
}

/* ---------- Ajust setmanal ---------- */
export interface WeeklyAdjustment {
  status: 'on_track' | 'too_slow' | 'too_fast' | 'not_enough_data' | 'low_appetite';
  title: string;
  message: string;
  deltaKcal: number;
  dataUsed: string;
  confidence: Confidence;
}
