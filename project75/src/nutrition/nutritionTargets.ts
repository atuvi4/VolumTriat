import type { NutritionTargets } from './nutritionTypes';
import { bmrMifflin, tdeeRange } from './nutritionCalculator';

export interface TargetInput {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  ritme: 'moderat' | 'agressiu';
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/**
 * Càlcul d'objectius nutricionals a partir del perfil.
 * Tot és una ESTIMACIÓ (factors d'activitat aproximats). La UI ho ha d'explicar.
 */
export function computeTargets(input: TargetInput): NutritionTargets {
  const { sex, age, heightCm, weightKg, ritme } = input;

  const bmr = Math.round(bmrMifflin(sex, weightKg, heightCm, age));
  const { low, mid, high } = tdeeRange(bmr);

  // Superàvit segons ritme (volum sostenible vs agressiu sostenible).
  // 'start' s'alinea amb el límit baix del rang perquè l'objectiu inicial coincideixi
  // amb el configurat (evita mostrar una xifra intermèdia òrfena tipus 3050).
  const surplus = ritme === 'agressiu' ? { lo: 250, hi: 450, start: 250 } : { lo: 100, hi: 250, start: 150 };

  const kcalRange: [number, number] = [round50(mid + surplus.lo), round50(mid + surplus.hi)];
  const kcalStart = round50(mid + surplus.start);

  // Proteïna 1,6-2,2 g/kg per volum/força
  const proteinRange: [number, number] = [Math.round(weightKg * 1.6), Math.round(weightKg * 2.2)];
  const proteinPerKg = 2.0;
  const proteinGrams = Math.round(weightKg * proteinPerKg); // objectiu pràctic ~2 g/kg

  // Greixos mínims 0,8 g/kg
  const fatMin = Math.round(weightKg * 0.8);

  // Carbohidrats com a resta de l'energia inicial
  const carbs = Math.max(0, Math.round((kcalStart - proteinGrams * 4 - fatMin * 9) / 4));

  // Pujada setmanal recomanada (~0,3-0,6% del pes)
  const weeklyGain: [number, number] = ritme === 'agressiu' ? [0.35, 0.6] : [0.2, 0.4];

  const explanation =
    `Objectiu calculat: ${kcalRange[0]}-${kcalRange[1]} kcal/dia. Comencem a ${kcalStart} kcal perquè el teu objectiu ` +
    `és pujar pes de manera ${ritme === 'agressiu' ? 'agressiva però sostenible' : 'moderada'}, amb gym 4-5 dies/setmana ` +
    `i introducció progressiva de cardio. Manteniment estimat ~${mid} kcal (rang ${low}-${high}); el superàvit és el que fa créixer.`;

  const proteinNote =
    `Proteïna recomanada: ${proteinRange[0]}-${proteinRange[1]} g/dia (1,6-2,2 g/kg). ` +
    `L'objectiu de ${Math.max(proteinGrams, 150)} g és una xifra alta pràctica i arrodonida, no un dogma: ` +
    `per sobre del mínim, més proteïna no fa mal i simplifica les decisions.`;

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
