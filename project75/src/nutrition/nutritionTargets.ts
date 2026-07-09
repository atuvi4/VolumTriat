import type { NutritionTargets } from './nutritionTypes';
import type { Goal } from '../types';
import { bmrMifflin, tdeeRange } from './nutritionCalculator';

export interface TargetInput {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  ritme: 'moderat' | 'agressiu';
  /** Objectiu corporal. Per defecte 'bulk' (compat amb el comportament anterior). */
  goal?: Goal;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

interface Adj {
  lo: number;
  hi: number;
  start: number;
}

/** Ajust de kcal sobre el manteniment (TDEE mig), segons objectiu i ritme. */
function goalAdjustment(goal: Goal, ritme: 'moderat' | 'agressiu'): Adj {
  if (goal === 'cut') {
    return ritme === 'agressiu' ? { lo: -600, hi: -400, start: -500 } : { lo: -400, hi: -200, start: -300 };
  }
  if (goal === 'maintain') {
    return { lo: -100, hi: 100, start: 0 };
  }
  return ritme === 'agressiu' ? { lo: 250, hi: 450, start: 250 } : { lo: 100, hi: 250, start: 150 };
}

/**
 * Càlcul d'objectius nutricionals a partir del perfil i l'objectiu corporal.
 * Tot és una ESTIMACIÓ (factors d'activitat aproximats). La UI ho ha d'explicar.
 */
export function computeTargets(input: TargetInput): NutritionTargets {
  const { sex, age, heightCm, weightKg, ritme } = input;
  const goal = input.goal ?? 'bulk';

  const bmr = Math.round(bmrMifflin(sex, weightKg, heightCm, age));
  const { low, mid, high } = tdeeRange(bmr);

  const adj = goalAdjustment(goal, ritme);
  const bmrFloor = round50(bmr); // mai per sota del BMR (sobretot en dèficit)

  const kcalRange: [number, number] = [
    Math.max(round50(mid + adj.lo), bmrFloor),
    Math.max(round50(mid + adj.hi), bmrFloor),
  ];
  const kcalStart = Math.max(round50(mid + adj.start), bmrFloor);

  // Proteïna 1,6-2,2 g/kg; objectiu pràctic ~2 g/kg
  const proteinRange: [number, number] = [Math.round(weightKg * 1.6), Math.round(weightKg * 2.2)];
  const proteinPerKg = 2.0;
  const proteinGrams = Math.round(weightKg * proteinPerKg);

  // Greixos mínims 0,8 g/kg; carbs com a resta de l'energia inicial
  const fatMin = Math.round(weightKg * 0.8);
  const carbs = Math.max(0, Math.round((kcalStart - proteinGrams * 4 - fatMin * 9) / 4));

  // Canvi de pes setmanal recomanat, COHERENT amb el superàvit/dèficit de kcal
  // (~7.700 kcal ≈ 1 kg): bulk agressiu +250-450 kcal/dia ≈ 0,25-0,45 kg/setm.
  // Prometre més del que les kcal donen faria que l'app digués «vas lent» per disseny.
  const weeklyGain: [number, number] =
    goal === 'cut'
      ? ritme === 'agressiu'
        ? [-0.55, -0.35]
        : [-0.35, -0.2]
      : goal === 'maintain'
        ? [-0.1, 0.1]
        : ritme === 'agressiu'
          ? [0.25, 0.45]
          : [0.1, 0.25];

  const goalWord = goal === 'cut' ? 'perdre greix' : goal === 'maintain' ? 'mantenir el pes' : 'pujar pes';
  const mech =
    goal === 'cut'
      ? 'el dèficit és el que fa baixar el greix'
      : goal === 'maintain'
        ? 'l’equilibri manté el pes'
        : 'el superàvit és el que fa créixer';

  const explanation =
    `Objectiu calculat: ${kcalRange[0]}-${kcalRange[1]} kcal/dia. Comencem a ${kcalStart} kcal perquè el teu objectiu ` +
    `és ${goalWord} de manera ${ritme === 'agressiu' ? 'agressiva però sostenible' : 'moderada'}. ` +
    `Manteniment estimat ~${mid} kcal (rang ${low}-${high}); ${mech}.`;

  const proteinNote =
    `Proteïna recomanada: ${proteinRange[0]}-${proteinRange[1]} g/dia (1,6-2,2 g/kg). ` +
    `L'objectiu de ${Math.max(proteinGrams, 120)} g és una xifra pràctica i arrodonida: ` +
    `${
      goal === 'cut'
        ? 'en dèficit, prioritzar proteïna preserva múscul'
        : 'per sobre del mínim, més proteïna no fa mal i simplifica les decisions'
    }.`;

  return {
    bmr,
    tdeeLow: low,
    tdeeMid: mid,
    tdeeHigh: high,
    kcalRange,
    kcalStart,
    proteinRange,
    proteinGrams,
    proteinPerKg,
    fatMin,
    carbs,
    weeklyGain,
    explanation,
    proteinNote,
  };
}
