import type { AppState, Goals, WeightEntry } from '../types';
import type { ResolvedMeal } from '../nutrition/nutritionTypes';

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

export const doneKcal = (meals: ResolvedMeal[]): number =>
  meals.filter((m) => m.done).reduce((s, m) => s + m.nutrition.kcal, 0);
export const doneProt = (meals: ResolvedMeal[]): number =>
  meals.filter((m) => m.done).reduce((s, m) => s + m.nutrition.protein, 0);
export const doneCount = (meals: ResolvedMeal[]): number => meals.filter((m) => m.done).length;

export const currentWeight = (weights: WeightEntry[]): number =>
  weights.length ? weights[weights.length - 1].kg : 0;

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
