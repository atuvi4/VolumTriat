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
  /** Slots addicionals on la recepta també encaixa (p. ex. dinar i sopar). */
  slots?: MealSlot[];
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

/** Estat real d'un àpat planificat durant el dia. */
export type MealStatus = 'pending' | 'done' | 'changed' | 'partial' | 'skipped';

/** Registre introduït per l'usuari (àpat canviat o extra). Dada manual, no verificada. */
export interface ManualLog {
  name?: string;
  kcal: number;
  protein: number;
  note?: string;
  /** L'usuari marca que aquesta ingesta és un batut (compta per l'objectiu de batuts). */
  isShake?: boolean;
}

/** Origen d'un extra: manual (l'afegeix l'usuari lliurement) o ajust recomanat. */
export type ExtraOrigin = 'manual' | 'adjustment' | 'shake' | 'rescue';

/** Context que acompanya un ajust afegit des de «Ajust per arribar avui».
 *  Permet que l'ajust sàpiga quin canvi l'ha provocat i on col·locar-lo. */
export interface AdjustContext {
  relatedMealId?: string;
  relatedMealStatus?: 'skipped' | 'partial' | 'changed';
  suggestedAfterMealId?: string;
  suggestedTiming?: string;
}

export interface ResolvedIngredient {
  foodId: string;
  name: string;
  grams: number;
  /** Pes de COMPRA (amb pell/os) si difereix del comestible. Les macros van sobre `grams`. */
  purchaseGrams?: number;
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
  /** Compatibilitat: true quan status === 'done'. La font de veritat és `status`. */
  done: boolean;
  /** Estat real de l'àpat. Si falta (dades antigues), es deriva de `done`. */
  status?: MealStatus;
  /** Percentatge menjat (0-100) quan status === 'partial'. */
  partialPct?: number;
  /** Dada manual quan status === 'changed' o és un extra. */
  logged?: ManualLog;
  /** True si és un extra afegit fora del menú (no és un àpat planificat). */
  isExtra?: boolean;
  /** Origen de l'extra (manual vs ajust recomanat). */
  extraOrigin?: ExtraOrigin;
  /** Àpat que ha motivat l'ajust, si n'hi ha. */
  relatedMealId?: string;
  relatedMealStatus?: 'skipped' | 'partial' | 'changed';
  /** Col·locació contextual: es mostra just després d'aquest àpat. */
  suggestedAfterMealId?: string;
  /** Text orientatiu de quan fer-lo (sense calcular hores). */
  suggestedTiming?: string;
  /** ISO de creació (per ordenar). */
  createdAt?: string;
  /** Origen quan la proposta s'ha substituït per una opció externa (p. ex. «Compra IA · Mercadona»).
   *  És metadada de procedència; NO implica que l'àpat estigui menjat. */
  originNote?: string;
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
