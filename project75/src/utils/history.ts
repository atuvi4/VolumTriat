import type { AppState } from '../types';
import type { MealOutcome } from '../brain/brainTypes';

/* Historial diari derivat dels outcomes del Brain (accions reals) + pesos +
   dies completats. Aproximació de control (V1): suma les accions que compten
   com a menjat. No és comptabilitat exacta si has fet i desfet molts cops. */

const EATEN: MealOutcome['action'][] = ['done', 'changed', 'partial', 'extra', 'adjustment_added'];

export interface DayHistory {
  date: string; // ISO
  kcal: number;
  protein: number;
  logged: number; // àpats registrats (menjats)
  skipped: number;
  weight?: number;
  completed: boolean;
}

/** Resum per dia, del més recent al més antic. */
export function dailyHistory(state: AppState, maxDays = 30): DayHistory[] {
  const map = new Map<string, DayHistory>();
  const get = (d: string): DayHistory => {
    let h = map.get(d);
    if (!h) {
      h = { date: d, kcal: 0, protein: 0, logged: 0, skipped: 0, completed: false };
      map.set(d, h);
    }
    return h;
  };

  for (const o of state.outcomes ?? []) {
    const h = get(o.date);
    if (EATEN.includes(o.action)) {
      h.kcal += o.kcal ?? 0;
      h.protein += o.protein ?? 0;
      h.logged += 1;
    } else if (o.action === 'skipped') {
      h.skipped += 1;
    }
  }
  for (const wgt of state.weights ?? []) get(wgt.d).weight = wgt.kg; // últim del dia guanya
  for (const d of state.completedDates ?? []) get(d).completed = true;

  return [...map.values()]
    .filter((h) => h.logged > 0 || h.skipped > 0 || h.weight != null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, maxDays);
}
