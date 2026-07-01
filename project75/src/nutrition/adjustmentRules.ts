import type { WeeklyAdjustment } from './nutritionTypes';

export interface WeightPoint {
  d: string;
  kg: number;
}

/** Mitjana dels últims N dies (per no reaccionar a un sol dia). */
function avgLastDays(weights: WeightPoint[], days: number): number | null {
  if (!weights.length) return null;
  const cutoff = Date.now() - days * 86400000;
  const recent = weights.filter((w) => new Date(w.d).getTime() >= cutoff);
  const list = recent.length ? recent : weights.slice(-3);
  return list.reduce((s, w) => s + w.kg, 0) / list.length;
}

/** Tendència kg/setmana sobre una finestra de dies. */
function trendPerWeek(weights: WeightPoint[], days: number): number | null {
  if (weights.length < 2) return null;
  const cutoff = Date.now() - days * 86400000;
  const win = weights.filter((w) => new Date(w.d).getTime() >= cutoff);
  const list = win.length >= 2 ? win : weights;
  const first = list[0];
  const last = list[list.length - 1];
  const spanDays = (new Date(last.d).getTime() - new Date(first.d).getTime()) / 86400000 || 1;
  return (last.kg - first.kg) / (spanDays / 7);
}

interface AdjustContext {
  weights: WeightPoint[];
  weeklyGainTarget: [number, number]; // dels targets
  lowAppetite: boolean;
}

/**
 * Regla d'ajust setmanal. Explica sempre la dada usada i la confiança.
 * No reacciona a un sol dia: mira mitjana i tendència de 14 dies.
 */
export function weeklyAdjustment(ctx: AdjustContext): WeeklyAdjustment {
  const { weights, weeklyGainTarget, lowAppetite } = ctx;

  if (lowAppetite) {
    return {
      status: 'low_appetite',
      title: 'Gana baixa aquests dies',
      message:
        'Amb poca gana, prioritza calories líquides (batuts) abans que pujar la xifra total. Recuperem el ritme normal quan torni la gana.',
      deltaKcal: 0,
      dataUsed: 'Estat "poca gana" actiu',
      confidence: 'medium',
    };
  }

  const avg = avgLastDays(weights, 7);
  const trend = trendPerWeek(weights, 14);

  if (avg == null || trend == null || weights.length < 4) {
    return {
      status: 'not_enough_data',
      title: 'Encara recopilant dades',
      message:
        'Registra el pes 2-3 cops per setmana durant 2 setmanes. Amb la mitjana i la tendència podré recomanar-te ajustos fiables.',
      deltaKcal: 0,
      dataUsed: `${weights.length} registres de pes`,
      confidence: 'low',
    };
  }

  const [minGoal, maxGoal] = weeklyGainTarget;

  if (trend < minGoal) {
    const delta = trend < minGoal / 2 ? 250 : 150;
    return {
      status: 'too_slow',
      title: 'El pes puja per sota de l’objectiu',
      message:
        `La tendència de 14 dies és ${trend.toFixed(2)} kg/setmana, per sota del teu objectiu (${minGoal}-${maxGoal}). ` +
        `Puja +${delta} kcal/dia de forma fàcil (un batut extra) i revisem la setmana vinent.`,
      deltaKcal: delta,
      dataUsed: `Tendència 14 dies: ${trend.toFixed(2)} kg/setm · mitjana 7 dies: ${avg.toFixed(1)} kg`,
      confidence: 'medium',
    };
  }

  if (trend > maxGoal * 1.6) {
    return {
      status: 'too_fast',
      title: 'El pes puja força ràpid',
      message:
        `Tendència ${trend.toFixed(2)} kg/setmana, per sobre del rang objectiu. Revisa gana, digestió i possible excés de greix. ` +
        `Si et trobes bé, es pot mantenir; si no, baixem 150-200 kcal.`,
      deltaKcal: -150,
      dataUsed: `Tendència 14 dies: ${trend.toFixed(2)} kg/setm`,
      confidence: 'medium',
    };
  }

  return {
    status: 'on_track',
    title: 'Vas dins de l’objectiu',
    message:
      `Tendència ${trend.toFixed(2)} kg/setmana, dins del rang (${minGoal}-${maxGoal}). Mantén les calories i la constància.`,
    deltaKcal: 0,
    dataUsed: `Tendència 14 dies: ${trend.toFixed(2)} kg/setm · mitjana 7 dies: ${avg.toFixed(1)} kg`,
    confidence: 'medium',
  };
}
