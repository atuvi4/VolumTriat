import type { CalculatedNutrition, FoodItem } from './nutritionTypes';

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

export const EMPTY_NUTRITION: CalculatedNutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

/** Nutrició d'una quantitat concreta d'un aliment. */
export function calcFood(food: FoodItem, grams: number): CalculatedNutrition {
  const f = grams / 100;
  return {
    kcal: food.kcalPer100g * f,
    protein: food.proteinPer100g * f,
    carbs: food.carbsPer100g * f,
    fat: food.fatPer100g * f,
    fiber: (food.fiberPer100g ?? 0) * f,
  };
}

export function addNutrition(a: CalculatedNutrition, b: CalculatedNutrition): CalculatedNutrition {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function roundNutrition(n: CalculatedNutrition): CalculatedNutrition {
  return { kcal: r0(n.kcal), protein: r0(n.protein), carbs: r0(n.carbs), fat: r0(n.fat), fiber: r1(n.fiber) };
}

/* ---------- Energètica (perfil) ---------- */

/** BMR — Mifflin-St Jeor. */
export function bmrMifflin(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Rang de TDEE segons factor d'activitat (gym 4-5 dies + cardio inicial). */
export function tdeeRange(bmr: number): { low: number; mid: number; high: number } {
  return { low: r0(bmr * 1.55), mid: r0(bmr * 1.65), high: r0(bmr * 1.725) };
}
