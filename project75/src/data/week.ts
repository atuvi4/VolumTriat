import type { WorkoutDay, WorkoutType } from '../types';

// getDay(): 0=Dg .. 6=Ds
export const WEEK: Record<number, WorkoutDay> = {
  1: { label: 'Pit + espatlla', type: 'gym', focus: 'Empeny fort i tanca la proteïna del dia.' },
  2: { label: 'Cames', type: 'gym', focus: 'Carrega hidrats: les cames volen energia.' },
  3: { label: 'Esquena + abdominals', type: 'gym', focus: 'Bon dia per un snack post-entreno.' },
  4: { label: 'Braç · tríceps, bíceps, espatlla', type: 'gym', focus: 'Sessió curta: aprofita per menjar bé.' },
  5: { label: 'Running suau · 5 km', type: 'run', focus: 'Ritme còmode. Compensa amb un batut.' },
  6: { label: 'Bici iniciació · 30-40 min', type: 'bike', focus: "Familiaritza't. Baix impacte, ideal." },
  0: { label: 'Natació tècnica · 20 min', type: 'swim', focus: 'Tècnica primer. Curt i tranquil.' },
};

export const CAT_LABEL: Record<WorkoutType, string> = {
  gym: 'Força',
  run: 'Running',
  bike: 'Bici',
  swim: 'Natació',
};

export const DAY_ABBR: Record<number, string> = {
  1: 'Dl', 2: 'Dt', 3: 'Dc', 4: 'Dj', 5: 'Dv', 6: 'Ds', 0: 'Dg',
};
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function todayWorkout(): WorkoutDay {
  return WEEK[new Date().getDay()];
}
