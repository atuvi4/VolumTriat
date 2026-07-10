import type { AppState, DailyLog, DailyLogMeal, WorkoutType } from '../types';
import type { ResolvedMeal } from '../nutrition/nutritionTypes';
import { goalsFor, mealEaten, mealStatus } from '../utils/goals';
import { dailyHistory } from '../utils/history';
import { ADAPT, WEEK } from '../data/week';
import { addDaysISO, todayISO } from '../utils/date';
import { startWeekSundayISO } from '../utils/project';

/* =========================================================
   History & Analytics v1 — snapshot diari.
   Regla d'or: el PASSAT és un snapshot congelat (history[date], fixat al
   canvi de dia amb l'estat final real); AVUI sempre es deriva en viu de
   l'estat. Així mai hi ha doble font de veritat pel dia en curs.
   Els dies previs a aquesta versió es reconstrueixen UNA vegada des dels
   outcomes del Brain (aproximat i marcat com a backfilled).
   ========================================================= */

/** Límit d'entrades (≈ 13 mesos): localStorage no és infinit. */
const MAX_HISTORY_DAYS = 400;

const at0 = (iso: string) => new Date(iso + 'T00:00:00');

/** Entrenament PLANIFICAT per a una data concreta (respecta la setmana 0). */
function plannedWorkoutFor(startISO: string, dateISO: string): { label: string; type: WorkoutType } | null {
  if (dateISO < startISO) return null;
  const w =
    dateISO <= startWeekSundayISO(startISO)
      ? ADAPT[Math.round((at0(dateISO).getTime() - at0(startISO).getTime()) / 86400000) % ADAPT.length]
      : WEEK[at0(dateISO).getDay()];
  return { label: w.label, type: w.type };
}

function sourceLabelOf(m: ResolvedMeal): string {
  if (m.logged) return /etiqueta/i.test(m.logged.note ?? '') ? 'Etiqueta revisada per tu' : 'Dada manual';
  return 'Recepta calculada';
}

/** Construeix el DailyLog d'un dia des de l'ESTAT VIU (per defecte, el dia
 *  que l'estat té carregat — al rollover és el dia que s'acaba). */
export function buildDailyLog(state: AppState, date = state.date): DailyLog {
  const g = goalsFor(state);
  const now = new Date().toISOString();

  // Defensiu: aquesta funció corre al rollover, ABANS de les reparacions d'estat.
  const meals = (state.meals ?? []).filter((m): m is ResolvedMeal => !!m);

  const planned: DailyLogMeal[] = meals
    .filter((m) => !m.isExtra)
    .map((m) => {
      const eaten = mealEaten(m);
      return {
        id: m.id,
        slot: m.slot,
        name: mealStatus(m) === 'changed' && m.logged?.name ? m.logged.name : m.name,
        status: mealStatus(m),
        kcal: eaten?.kcal ?? 0,
        protein: eaten?.protein ?? 0,
        sourceLabel: sourceLabelOf(m),
      };
    });

  const extras = meals
    .filter((m) => m.isExtra)
    .map((m) => {
      const eaten = mealEaten(m);
      return { name: m.logged?.name ?? m.name, kcal: eaten?.kcal ?? 0, protein: eaten?.protein ?? 0 };
    });

  const kcal = planned.reduce((s, m) => s + m.kcal, 0) + extras.reduce((s, e) => s + e.kcal, 0);
  const protein = planned.reduce((s, m) => s + m.protein, 0) + extras.reduce((s, e) => s + e.protein, 0);

  const workout = plannedWorkoutFor(state.profile.projectStartDate, date);
  const prev = state.history?.[date];

  return {
    date,
    kcal,
    protein,
    targetKcal: g.kcal,
    targetProtein: g.prot,
    meals: planned,
    extras,
    supplements: {
      creatine: (state.supplements?.creatineDates ?? []).includes(date),
      anabolicMaster: extras.some((e) => /anabolic/i.test(e.name)) || undefined,
    },
    training: {
      plannedLabel: workout?.label,
      plannedType: workout?.type,
      done: (state.gymDates ?? []).includes(date) || (date === state.date && state.gymDone),
    },
    weightKg: [...(state.weights ?? [])].reverse().find((w) => w.d === date)?.kg,
    dayMode: state.dayMode !== 'normal' ? state.dayMode : undefined,
    completed: (state.completedDates ?? []).includes(date),
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Retalla l'historial a les últimes MAX_HISTORY_DAYS entrades. */
export function pruneHistory(history: Record<string, DailyLog>): Record<string, DailyLog> {
  const keys = Object.keys(history).sort();
  if (keys.length <= MAX_HISTORY_DAYS) return history;
  const keep = new Set(keys.slice(-MAX_HISTORY_DAYS));
  return Object.fromEntries(Object.entries(history).filter(([k]) => keep.has(k)));
}

/** Fixa el snapshot del dia carregat a l'estat (usat al canvi de dia). */
export function upsertTodayLog(state: AppState): AppState {
  return { ...state, history: pruneHistory({ ...(state.history ?? {}), [state.date]: buildDailyLog(state) }) };
}

/** Log d'una data: avui en viu, el passat del snapshot. */
export function getDailyLog(state: AppState, date: string): DailyLog | undefined {
  if (date === state.date) return buildDailyLog(state);
  return state.history?.[date];
}

/** Tots els logs (passat congelat + avui en viu), del més recent al més antic. */
export function listDailyLogs(state: AppState): DailyLog[] {
  const map: Record<string, DailyLog> = { ...(state.history ?? {}) };
  map[state.date] = buildDailyLog(state);
  return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Un dia té dades que valgui la pena ensenyar? */
export function logHasData(l: DailyLog): boolean {
  return l.kcal > 0 || l.weightKg != null || l.training.done || l.supplements.creatine || l.completed;
}

export interface HistorySummary {
  from: string;
  to: string;
  /** Dies del rang amb alguna dada real. */
  daysWithData: number;
  /** Dies amb menjar registrat (base de les mitjanes i el compliment). */
  eatingDays: number;
  totalDays: number;
  avgKcal: number | null;
  avgProtein: number | null;
  /** Dies amb kcal ≥ 90% de l'objectiu d'aquell dia. */
  kcalHitDays: number;
  /** Dies amb proteïna ≥ objectiu d'aquell dia. */
  proteinHitDays: number;
  completedDays: number;
  trainingsDone: number;
  creatineDays: number;
  weightStart?: number;
  weightEnd?: number;
}

/** Resum d'un rang de dates [from..to] (ambdues incloses). */
function summarize(state: AppState, from: string, to: string): HistorySummary {
  const logs = listDailyLogs(state).filter((l) => l.date >= from && l.date <= to);
  const withData = logs.filter(logHasData);
  const eatingDays = withData.filter((l) => l.kcal > 0);
  const weights = withData.filter((l) => l.weightKg != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const totalDays = Math.round((at0(to).getTime() - at0(from).getTime()) / 86400000) + 1;
  return {
    from,
    to,
    daysWithData: withData.length,
    eatingDays: eatingDays.length,
    totalDays,
    avgKcal: eatingDays.length ? Math.round(eatingDays.reduce((s, l) => s + l.kcal, 0) / eatingDays.length) : null,
    avgProtein: eatingDays.length ? Math.round(eatingDays.reduce((s, l) => s + l.protein, 0) / eatingDays.length) : null,
    kcalHitDays: eatingDays.filter((l) => l.kcal >= l.targetKcal * 0.9).length,
    proteinHitDays: eatingDays.filter((l) => l.protein >= l.targetProtein).length,
    completedDays: withData.filter((l) => l.completed).length,
    trainingsDone: withData.filter((l) => l.training.done).length,
    creatineDays: withData.filter((l) => l.supplements.creatine).length,
    weightStart: weights[0]?.weightKg,
    weightEnd: weights[weights.length - 1]?.weightKg,
  };
}

/** Resum dels últims N dies (avui inclòs). */
export function lastNDaysSummary(state: AppState, n: number): HistorySummary {
  const to = todayISO();
  return summarize(state, addDaysISO(to, -(n - 1)), to);
}

/** Resum d'una setmana concreta (dilluns a diumenge). */
export function weekSummary(state: AppState, weekStartISO: string): HistorySummary {
  return summarize(state, weekStartISO, addDaysISO(weekStartISO, 6));
}

/** Backfill ÚNIC: reconstrueix el passat des dels outcomes del Brain quan
 *  l'estat encara no té history. Aproximat (sense detall fiable d'àpats) i
 *  marcat com a backfilled; mai sobreescriu snapshots reals. */
export function backfillHistoryFromOutcomes(state: AppState): Record<string, DailyLog> {
  const out: Record<string, DailyLog> = {};
  const now = new Date().toISOString();
  const start = state.profile.projectStartDate;
  for (const row of dailyHistory(state, 365)) {
    if (row.date === state.date || row.date < start) continue; // avui va en viu
    const workout = plannedWorkoutFor(start, row.date);
    out[row.date] = {
      date: row.date,
      kcal: row.kcal,
      protein: row.protein,
      // Objectius aproximats: els del perfil actual (els reals d'aquell dia no es van guardar).
      targetKcal: state.profile.kcalGoal,
      targetProtein: state.profile.protGoal,
      meals: [],
      extras: [],
      supplements: { creatine: (state.supplements?.creatineDates ?? []).includes(row.date) },
      training: { plannedLabel: workout?.label, plannedType: workout?.type, done: (state.gymDates ?? []).includes(row.date) },
      weightKg: row.weight,
      completed: row.completed,
      backfilled: true,
      createdAt: now,
      updatedAt: now,
    };
  }
  return pruneHistory(out);
}
