import type { WorkoutDay, WorkoutType } from '../types';
import { isStarted, inAdaptationWeek, projectDay } from '../utils/project';

// getDay(): 0=Dg .. 6=Ds
export const WEEK: Record<number, WorkoutDay> = {
  1: { label: 'Pit + espatlla', type: 'gym', focus: 'Empeny fort i tanca la proteïna del dia.' },
  2: { label: 'Cames', type: 'gym', focus: 'Carrega hidrats: les cames volen energia.' },
  3: { label: 'Esquena + abdominals', type: 'gym', focus: 'Bon dia per un snack post-entreno.' },
  4: { label: 'Braç · tríceps, bíceps, espatlla', type: 'gym', focus: 'Sessió curta: aprofita per menjar bé.' },
  5: { label: 'Running zona 2 · 5 km', type: 'run', focus: 'Ritme còmode, hauries de poder parlar. Compensa amb un batut.' },
  6: { label: 'Running zona 2 o gym suau · 30-40 min', type: 'run', focus: 'Suau. La bici entrarà aquí més endavant, sense pressa.' },
  0: { label: 'Descans o caminada', type: 'rest', focus: 'Dia lleuger de veritat. La natació arribarà progressivament.' },
};

export const CAT_LABEL: Record<WorkoutType, string> = {
  gym: 'Força',
  run: 'Running',
  bike: 'Bici',
  swim: 'Natació',
  rest: 'Descans',
};

export const DAY_ABBR: Record<number, string> = {
  1: 'Dl', 2: 'Dt', 3: 'Dc', 4: 'Dj', 5: 'Dv', 6: 'Ds', 0: 'Dg',
};
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function todayWorkout(): WorkoutDay {
  return WEEK[new Date().getDay()];
}

/* ---------- Setmana 0 · Adaptació ---------- */
/** Sessions de la setmana d'adaptació (Dia 1..3). El focus real és la nutrició. */
export const ADAPT: WorkoutDay[] = [
  { label: 'Sessió suau + primer dia de nutrició', type: 'gym', focus: "El focus real d'avui és la nutrició: primer dia complet. L'entrenament, suau." },
  { label: 'Gym o running zona 2 · 30-40 min', type: 'run', focus: 'Tu tries: gym de base o un running suau. Sense intensitat.' },
  { label: 'Descans o caminada', type: 'rest', focus: 'Dia lleuger. Opcional: bici només si ve de gust, mai per obligació.' },
];

export interface TodayTraining {
  workout: WorkoutDay;
  /** Estem a la setmana d'adaptació. */
  adaptation: boolean;
  /** Sessió de baixa pressió (suau, opcional). */
  soft: boolean;
  /** El focus del dia és la nutrició, no l'entrenament (p. ex. Dia 1). */
  nutritionPriority: boolean;
}

/**
 * FONT ÚNICA de l'entrenament del dia. Avui i Entrenament n'han d'usar aquesta.
 * Respecta la setmana d'adaptació: si hi som, retorna la sessió d'adaptació
 * (suau) i, el Dia 1, marca la nutrició com a prioritat.
 */
export function resolveTodayTraining(startISO: string): TodayTraining {
  if (isStarted(startISO) && inAdaptationWeek(startISO)) {
    const idx = Math.min(projectDay(startISO) - 1, ADAPT.length - 1);
    return { workout: ADAPT[idx], adaptation: true, soft: true, nutritionPriority: idx === 0 };
  }
  return { workout: todayWorkout(), adaptation: false, soft: false, nutritionPriority: false };
}
