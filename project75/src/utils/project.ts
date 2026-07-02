import type { AppState } from '../types';
import { todayISO, toLocalISO } from './date';

const at0 = (iso: string) => new Date(iso + 'T00:00:00');
const DAY = 86400000;

/** Ha començat el projecte? (avui >= data d'inici) */
export function isStarted(startISO: string): boolean {
  return todayISO() >= startISO;
}

/** Dies que falten fins a l'inici (0 si ja ha començat). */
export function daysUntilStart(startISO: string): number {
  const diff = Math.round((at0(startISO).getTime() - at0(todayISO()).getTime()) / DAY);
  return Math.max(0, diff);
}

/** Dia del projecte (Dia 1 = data d'inici). 0 si encara no ha començat. */
export function projectDay(startISO: string): number {
  if (!isStarted(startISO)) return 0;
  return Math.round((at0(todayISO()).getTime() - at0(startISO).getTime()) / DAY) + 1;
}

/** Diumenge que tanca la setmana de la data d'inici (setmana Dl-Dg). */
export function startWeekSundayISO(startISO: string): string {
  const s = at0(startISO);
  const day = s.getDay(); // 0=Dg..6=Ds
  const toSunday = (7 - day) % 7;
  s.setDate(s.getDate() + toSunday);
  return toLocalISO(s);
}

/** Estem a la primera setmana parcial (adaptació) entre l'inici i el diumenge? */
export function inAdaptationWeek(startISO: string): boolean {
  return isStarted(startISO) && todayISO() <= startWeekSundayISO(startISO);
}

/** Constància (%) només des de la data d'inici. null si no n'hi ha prou. */
export function consistencyPct(state: AppState): number | null {
  const start = state.profile.projectStartDate;
  if (!isStarted(start)) return null;
  const day = projectDay(start);
  if (day < 3) return null; // encara no n'hi ha prou
  const today = at0(todayISO()).getTime();
  const windowStart = Math.max(at0(start).getTime(), today - 29 * DAY);
  const windowDays = Math.round((today - windowStart) / DAY) + 1;
  const done = (state.completedDates ?? []).filter((d) => {
    const t = at0(d).getTime();
    return t >= windowStart && t <= today;
  }).length;
  return Math.round((done / windowDays) * 100);
}

/** Pesos reals (a partir de la data d'inici). */
export function realWeights(state: AppState) {
  return state.weights.filter((w) => w.d >= state.profile.projectStartDate);
}
