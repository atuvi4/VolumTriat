import type { AppState } from '../types';
import type { MealRecipe, MealSlot } from '../nutrition/nutritionTypes';
import type {
  FoodPreference,
  MealOutcome,
  UserNutritionProfile,
  WeeklyLearningSummary,
} from './brainTypes';

/* =========================================================
   Project75 Brain v1 — derivació d'aprenentatge (tot LOCAL, pur).
   Cap IA de pagament, cap backend. Només llegeix outcomes reals.
   ========================================================= */

const MAX_OUTCOMES = 500; // límit per no inflar localStorage
/** Mínim d'outcomes per mostrar insights (no inventem res amb poques dades). */
export const MIN_OUTCOMES_FOR_INSIGHTS = 8;

const SLOT_ARTICLE: Record<MealSlot, string> = {
  esmorzar: "L'esmorzar",
  dinar: 'El dinar',
  berenar: 'El berenar',
  sopar: 'El sopar',
  snack: "L'snack",
};

/** Afegeix un outcome (immutable) i limita la mida de l'historial. */
export function appendOutcome(outcomes: MealOutcome[], o: MealOutcome): MealOutcome[] {
  return [...outcomes, o].slice(-MAX_OUTCOMES);
}

/** Preferències agregades per àpat (nom + slot). */
export function foodPreferences(outcomes: MealOutcome[]): FoodPreference[] {
  const map = new Map<string, FoodPreference>();
  for (const o of outcomes) {
    if (!o.mealName) continue;
    const key = `${o.slot}::${o.mealName}`;
    const p =
      map.get(key) ??
      { key: o.mealName, slot: o.slot, doneCount: 0, skippedCount: 0, changedCount: 0, dislikedCount: 0, score: 0 };
    if (o.action === 'done') p.doneCount++;
    else if (o.action === 'skipped') p.skippedCount++;
    else if (o.action === 'changed') p.changedCount++;
    else if (o.action === 'disliked') p.dislikedCount++;
    map.set(key, p);
  }
  for (const p of map.values()) {
    p.score = p.doneCount * 2 - p.skippedCount - p.changedCount * 1.5 - p.dislikedCount * 3;
  }
  return [...map.values()];
}

/** Puntuació apresa d'una recepta (per ordenar alternatives). 0 si no hi ha dades. */
export function recipeScore(outcomes: MealOutcome[], recipe: { name: string }): number {
  const prefs = foodPreferences(outcomes).filter((p) => p.key === recipe.name);
  return prefs.reduce((s, p) => s + p.score, 0);
}

/** Reordena alternatives de "Canviar" per adequació apresa (suau, mantenint varietat).
 *  Les evitades no s'eliminen: només baixen. Ordre estable. */
export function rankSwapOptions(options: MealRecipe[], outcomes: MealOutcome[]): MealRecipe[] {
  if (outcomes.length === 0) return options;
  const scored = options.map((r, i) => ({ r, i, s: recipeScore(outcomes, r) }));
  scored.sort((a, b) => b.s - a.s || a.i - b.i); // score desc, després ordre original (estable)
  return scored.map((x) => x.r);
}

const distinctDays = (outcomes: MealOutcome[]) => new Set(outcomes.map((o) => o.date)).size;

/** Perfil nutricional aprés (derivat, no persistit). */
export function getUserNutritionProfile(state: AppState): UserNutritionProfile {
  const outcomes = state.outcomes ?? [];
  const prefs = foodPreferences(outcomes);

  const preferredMeals = prefs
    .filter((p) => p.doneCount >= 2 && p.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p) => p.key);

  const avoidedMeals = prefs
    .filter((p) => p.score < 0 && p.skippedCount + p.changedCount + p.dislikedCount >= 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((p) => p.key);

  // Slots difícils: molta proporció de saltat/canviat.
  const bySlot = new Map<MealSlot, { total: number; hard: number }>();
  for (const o of outcomes) {
    const s = bySlot.get(o.slot) ?? { total: 0, hard: 0 };
    if (['done', 'skipped', 'changed', 'partial'].includes(o.action)) {
      s.total++;
      if (o.action === 'skipped' || o.action === 'changed') s.hard++;
    }
    bySlot.set(o.slot, s);
  }
  const difficultSlots = [...bySlot.entries()]
    .filter(([, v]) => v.total >= 3 && v.hard / v.total >= 0.5)
    .map(([slot]) => slot);

  // Freqüència de poca gana (per dies).
  const days = distinctDays(outcomes);
  const lowAppetiteDays = new Set(
    outcomes.filter((o) => o.appetite === 'poca' || o.dayMode === 'pocaGana').map((o) => o.date),
  ).size;
  const lowAppetiteFrequency = days ? lowAppetiteDays / days : 0;

  // Millors rescats: ajustos/extres que "es queden" (afegits menys retirats).
  const rescue = new Map<string, number>();
  for (const o of outcomes) {
    if (o.action === 'adjustment_added' || o.action === 'extra') rescue.set(o.mealName, (rescue.get(o.mealName) ?? 0) + 1);
    if (o.action === 'adjustment_removed') rescue.set(o.mealName, (rescue.get(o.mealName) ?? 0) - 1);
  }
  const bestRescueOptions = [...rescue.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // Adherència.
  const count = (a: string) => outcomes.filter((o) => o.action === a).length;
  const done = count('done');
  const skipped = count('skipped');
  const changed = count('changed');
  const partial = count('partial');
  const denom = done + skipped + changed + partial;

  return {
    preferredMeals,
    avoidedMeals,
    difficultSlots,
    lowAppetiteFrequency,
    bestRescueOptions,
    adherenceSummary: { days, done, skipped, changed, partial, doneRatio: denom ? done / denom : null },
  };
}

/** Resum setmanal (últims 7 dies) — per revisió i export. */
export function weeklyLearningSummary(outcomes: MealOutcome[]): WeeklyLearningSummary {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceISO = since.toISOString().slice(0, 10);
  const week = outcomes.filter((o) => o.date >= sinceISO);
  const prefs = foodPreferences(week);
  const done = week.filter((o) => o.action === 'done').length;
  const denom = week.filter((o) => ['done', 'skipped', 'changed', 'partial'].includes(o.action)).length;
  return {
    weekStart: sinceISO,
    outcomes: week.length,
    adherencePct: denom ? Math.round((done / denom) * 100) : null,
    topPreferred: prefs.filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((p) => p.key),
    topAvoided: prefs.filter((p) => p.score < 0).sort((a, b) => a.score - b.score).slice(0, 3).map((p) => p.key),
    difficultSlots: getUserNutritionProfile({ outcomes: week } as AppState).difficultSlots,
  };
}

/** Insights curts per a la UI. Només si hi ha prou dades; mai inventats. */
export function brainInsights(state: AppState): string[] {
  const outcomes = state.outcomes ?? [];
  if (outcomes.length < MIN_OUTCOMES_FOR_INSIGHTS) return [];
  const profile = getUserNutritionProfile(state);
  const out: string[] = [];

  // Slot més consistent (major ràtio de "fet").
  const bySlot = new Map<MealSlot, { total: number; done: number }>();
  for (const o of outcomes) {
    if (!['done', 'skipped', 'changed', 'partial'].includes(o.action)) continue;
    const s = bySlot.get(o.slot) ?? { total: 0, done: 0 };
    s.total++;
    if (o.action === 'done') s.done++;
    bySlot.set(o.slot, s);
  }
  const consistent = [...bySlot.entries()]
    .filter(([, v]) => v.total >= 3)
    .map(([slot, v]) => ({ slot, ratio: v.done / v.total }))
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (consistent && consistent.ratio >= 0.6) out.push(`${SLOT_ARTICLE[consistent.slot]} és el teu àpat més consistent.`);

  // Slots difícils (canvis/saltats).
  if (profile.difficultSlots.length) {
    const s = profile.difficultSlots[0];
    out.push(`Sovint canvies o saltes ${SLOT_ARTICLE[s].toLowerCase()}.`);
  }

  // Batuts en dies de poca gana.
  const shakeLowApp = outcomes.filter(
    (o) =>
      (o.appetite === 'poca' || o.dayMode === 'pocaGana') &&
      ['done', 'extra', 'adjustment_added'].includes(o.action) &&
      /batut/i.test(o.mealName),
  ).length;
  if (shakeLowApp >= 2) out.push('Els batuts et funcionen en dies de poca gana.');

  // Preferit repetit.
  if (profile.preferredMeals.length) out.push(`Repeteixes sovint «${profile.preferredMeals[0]}».`);

  // Evitat.
  if (profile.avoidedMeals.length) out.push(`Sovint evites «${profile.avoidedMeals[0]}».`);

  return out.slice(0, 5);
}

/** Exporta el dataset d'aprenentatge (per a futur model local / fine-tuning). */
export function exportBrainData(state: AppState) {
  const outcomes = state.outcomes ?? [];
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    outcomes,
    profile: getUserNutritionProfile(state),
    weekly: weeklyLearningSummary(outcomes),
    note: 'Project75 Brain v1 — dataset local d\'ús real. Cap dada nutricional inventada.',
  };
}
