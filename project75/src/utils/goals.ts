import type { AppState, Goals, WeightEntry } from '../types';
import type { CalculatedNutrition, ManualLog, MealStatus, ResolvedMeal } from '../nutrition/nutritionTypes';

export function goalsFor(state: AppState): Goals {
  const { dayMode, profile } = state;
  if (dayMode === 'dificil') return { kcal: 1800, prot: 80, meals: 2, label: 'Dia difícil' };
  if (dayMode === 'pocaGana') return { kcal: 2600, prot: 120, meals: 4, label: 'Poca gana' };
  return {
    kcal: profile.kcalGoal,
    prot: profile.protGoal,
    meals: 5,
    label: profile.ritme === 'agressiu' ? 'Agressiu sostenible' : 'Moderat',
  };
}

/** Estat real de l'àpat. Deriva de `done` si `status` no hi és (dades antigues). */
export function mealStatus(m: ResolvedMeal): MealStatus {
  return m.status ?? (m.done ? 'done' : 'pending');
}

/**
 * Nutrició que REALMENT consta com menjada d'un àpat, o null si no compta.
 * - done → recepta calculada
 * - changed / extra → dada manual introduïda per l'usuari
 * - partial → estimació proporcional de la recepta
 * - pending / skipped → no suma
 */
export function mealEaten(m: ResolvedMeal): CalculatedNutrition | null {
  const st = mealStatus(m);
  if (st === 'done') return m.nutrition;
  if (st === 'changed') {
    if (!m.logged) return null;
    return { kcal: m.logged.kcal, protein: m.logged.protein, carbs: 0, fat: 0, fiber: 0 };
  }
  if (st === 'partial') {
    const f = Math.max(0, Math.min(100, m.partialPct ?? 0)) / 100;
    const n = m.nutrition;
    return {
      kcal: Math.round(n.kcal * f),
      protein: Math.round(n.protein * f),
      carbs: Math.round(n.carbs * f),
      fat: Math.round(n.fat * f),
      fiber: Math.round(n.fiber * f * 10) / 10,
    };
  }
  return null; // pending, skipped
}

/**
 * Valors actuals de l'àpat en format ManualLog, per PRE-OMPLIR l'edició.
 * Si ja té una dada manual (changed) la reutilitza; si no, parteix del que
 * consta menjat ara o, si encara és pendent, de la recepta planificada.
 */
export function mealAsManualLog(m: ResolvedMeal): ManualLog {
  if (m.logged) return { ...m.logged };
  const n = mealEaten(m) ?? m.nutrition;
  return { name: m.name, kcal: n.kcal, protein: n.protein };
}

export const doneKcal = (meals: ResolvedMeal[]): number =>
  meals.reduce((s, m) => s + (mealEaten(m)?.kcal ?? 0), 0);
export const doneProt = (meals: ResolvedMeal[]): number =>
  meals.reduce((s, m) => s + (mealEaten(m)?.protein ?? 0), 0);
/** Àpats amb intake real (fet + canviat + parcial + extres). */
export const doneCount = (meals: ResolvedMeal[]): number =>
  meals.filter((m) => mealEaten(m) !== null).length;

/** Recompte d'estats dels àpats PLANIFICATS (exclou extres). */
export function statusCounts(meals: ResolvedMeal[]): Record<MealStatus, number> {
  const c: Record<MealStatus, number> = { pending: 0, done: 0, changed: 0, partial: 0, skipped: 0 };
  for (const m of meals) if (!m.isExtra) c[mealStatus(m)]++;
  return c;
}

export const currentWeight = (weights: WeightEntry[]): number =>
  weights.length ? weights[weights.length - 1].kg : 0;

/** Mínim de registres reals per considerar una tendència fiable. */
export const MIN_FOR_TREND = 4;

export function trendPerWeek(weights: WeightEntry[]): number {
  if (weights.length < 2) return 0;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const days = (new Date(last.d).getTime() - new Date(first.d).getTime()) / 86400000 || 1;
  return (last.kg - first.kg) / (days / 7);
}

export function nextMilestone(weight: number, target1: number): number {
  return [68, 70, 72, 75].find((m) => weight < m) ?? target1;
}
