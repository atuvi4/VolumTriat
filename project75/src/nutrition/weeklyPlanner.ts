import type { MealRecipe, MealSlot, ResolvedMeal } from './nutritionTypes';
import { PLANNER_POOL } from './plannerRecipes';
import { slotMatchesRecipe } from './mealPlans';
import { resolveRecipe } from './mealBuilder';
import { getFood } from './foodDatabase';
import { toLocalISO } from '../utils/date';

/* =========================================================
   Weekly Nutrition Planner v1 — genera un menú setmanal amb varietat,
   pensat per a volum (~3000 kcal / 150 g proteïna). Tot local, sense IA.
   Regles de varietat:
   - No repetir la mateixa base d'hidrats dins el mateix dia (pasta/pa pesa més).
   - No repetir la mateixa proteïna dins el mateix dia.
   - Evitar la mateixa base al mateix àpat dos dies seguits.
   - L'snack tanca el dia acostant-se al target de calories.
   ========================================================= */

export interface PlannedMeal {
  slot: MealSlot;
  recipeId: string;
  name: string;
  kcal: number;
  protein: number;
}

export interface PlannedDay {
  date: string; // ISO
  weekday: number; // 0=diumenge .. 6=dissabte
  meals: PlannedMeal[];
  kcal: number;
  protein: number;
}

export interface WeeklyMenu {
  weekStartISO: string; // dilluns
  days: PlannedDay[];
  generatedAt: string;
}

export interface PlannerInput {
  startDate: string; // qualsevol data dins la setmana desitjada
  dislikes?: string[];
  targetKcal?: number;
  targetProtein?: number;
}

const MAIN_SLOTS: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar'];
const DEFAULT_TARGET_KCAL = 3000;

const CARB_BASE: Record<string, string> = {
  rice_cooked: 'arròs', pasta_cooked: 'pasta', potato_cooked: 'patata', bread: 'pa',
  oats: 'civada', couscous_cooked: 'cuscús', cereal: 'cereals',
  lentils_cooked: 'llegums', chickpeas_cooked: 'llegums',
};
const PROTEIN_SRC: Record<string, string> = {
  chicken_breast: 'pollastre', turkey_breast: 'gall dindi', tuna_can: 'tonyina', salmon: 'salmó',
  egg: 'ous', beef_lean: 'vedella', beef_mince_cooked: 'carn picada',
  lentils_cooked: 'llegums', chickpeas_cooked: 'llegums',
  greek_yogurt: 'iogurt', protein_yogurt: 'iogurt proteic', whey: 'proteïna', milk_whole: 'làctic',
};

const PLANNER_BY_ID: Record<string, MealRecipe> = Object.fromEntries(PLANNER_POOL.map((r) => [r.id, r]));

const nutMemo = new Map<string, { kcal: number; protein: number }>();
function recipeNut(r: MealRecipe): { kcal: number; protein: number } {
  let n = nutMemo.get(r.id);
  if (!n) {
    const rn = resolveRecipe(r).nutrition;
    n = { kcal: rn.kcal, protein: rn.protein };
    nutMemo.set(r.id, n);
  }
  return n;
}

function carbBaseOf(r: MealRecipe): string | null {
  for (const ing of r.ingredients) if (CARB_BASE[ing.foodId]) return CARB_BASE[ing.foodId];
  return null;
}
function proteinOf(r: MealRecipe): string | null {
  for (const ing of r.ingredients) if (PROTEIN_SRC[ing.foodId]) return PROTEIN_SRC[ing.foodId];
  return null;
}
function isDisliked(name: string, dislikes: string[]): boolean {
  return dislikes.some((d) => d && name.toLowerCase().includes(d.toLowerCase()));
}
function poolForSlot(slot: MealSlot): MealRecipe[] {
  return PLANNER_POOL.filter((r) => slotMatchesRecipe(r, slot));
}

interface DayState {
  usedRecipes: Set<string>;
  carbs: Set<string>;
  proteins: Set<string>;
  liquid: boolean; // ja hi ha un batut/àpat líquid avui
}

const isLiquid = (r: MealRecipe): boolean => r.tags.includes('liquid_calories');

function register(st: DayState, r: MealRecipe): void {
  st.usedRecipes.add(r.id);
  const cb = carbBaseOf(r);
  const ps = proteinOf(r);
  if (cb) st.carbs.add(cb);
  if (ps) st.proteins.add(ps);
  if (isLiquid(r)) st.liquid = true;
}

function pickMeal(
  slot: MealSlot,
  st: DayState,
  prevCarbBySlot: Record<string, string | undefined>,
  dislikes: string[],
): MealRecipe {
  const cands = poolForSlot(slot).filter((r) => !st.usedRecipes.has(r.id) && !isDisliked(r.name, dislikes));
  const list = cands.length ? cands : poolForSlot(slot);
  let best = list[0];
  let bestScore = Infinity;
  for (const r of list) {
    const cb = carbBaseOf(r);
    const ps = proteinOf(r);
    let s = 0;
    if (cb && st.carbs.has(cb)) s += cb === 'pasta' || cb === 'pa' ? 3 : 2; // repetir base al mateix dia
    if (ps && st.proteins.has(ps)) s += 1; // repetir proteïna al mateix dia
    if (cb && prevCarbBySlot[slot] === cb) s += 1; // mateixa base al mateix àpat ahir
    if (isLiquid(r) && st.liquid) s += 4; // màxim un batut/líquid al dia
    s += Math.random() * 0.9; // desempat amb varietat
    if (s < bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return best;
}

function generateDay(
  dateISO: string,
  prevCarbBySlot: Record<string, string | undefined>,
  input: PlannerInput,
): PlannedDay {
  const dislikes = input.dislikes ?? [];
  const targetKcal = input.targetKcal ?? DEFAULT_TARGET_KCAL;
  const st: DayState = { usedRecipes: new Set(), carbs: new Set(), proteins: new Set(), liquid: false };
  const meals: PlannedMeal[] = [];
  let kcal = 0;
  let protein = 0;

  for (const slot of MAIN_SLOTS) {
    const r = pickMeal(slot, st, prevCarbBySlot, dislikes);
    register(st, r);
    const n = recipeNut(r);
    meals.push({ slot, recipeId: r.id, name: r.name, kcal: n.kcal, protein: n.protein });
    kcal += n.kcal;
    protein += n.protein;
  }

  // Snack: tanca el dia acostant-se al target de kcal, penalitzant repeticions.
  const snackCands = poolForSlot('snack').filter((r) => !st.usedRecipes.has(r.id) && !isDisliked(r.name, dislikes));
  const snackList = snackCands.length ? snackCands : poolForSlot('snack');
  let bestSnack = snackList[0];
  let bestErr = Infinity;
  for (const r of snackList) {
    const n = recipeNut(r);
    let err = Math.abs(kcal + n.kcal - targetKcal);
    const cb = carbBaseOf(r);
    const ps = proteinOf(r);
    if (cb && st.carbs.has(cb)) err += 60;
    if (ps && st.proteins.has(ps)) err += 30;
    if (isLiquid(r) && st.liquid) err += 400; // no un segon batut si ja n'hi ha un
    if (err < bestErr) {
      bestErr = err;
      bestSnack = r;
    }
  }
  const sn = recipeNut(bestSnack);
  register(st, bestSnack);
  meals.push({ slot: 'snack', recipeId: bestSnack.id, name: bestSnack.name, kcal: sn.kcal, protein: sn.protein });
  kcal += sn.kcal;
  protein += sn.protein;

  const d = new Date(dateISO + 'T00:00:00');
  return { date: dateISO, weekday: d.getDay(), meals, kcal, protein };
}

/** Dilluns (ISO) de la setmana que conté la data. */
export function weekStartISO(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  const diff = (d.getDay() + 6) % 7; // dies des de dilluns
  d.setDate(d.getDate() - diff);
  return toLocalISO(d);
}

function updatePrevCarbs(prev: Record<string, string | undefined>, day: PlannedDay): void {
  for (const m of day.meals) {
    const r = PLANNER_BY_ID[m.recipeId];
    const cb = r ? carbBaseOf(r) : null;
    if (cb) prev[m.slot] = cb;
  }
}

/** Genera un menú de 7 dies (dilluns→diumenge) de la setmana de `startDate`. */
export function generateWeeklyMenu(input: PlannerInput): WeeklyMenu {
  const start = weekStartISO(input.startDate);
  const prevCarbBySlot: Record<string, string | undefined> = {};
  const days: PlannedDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const day = generateDay(toLocalISO(d), prevCarbBySlot, input);
    updatePrevCarbs(prevCarbBySlot, day);
    days.push(day);
  }
  return { weekStartISO: start, days, generatedAt: new Date().toISOString() };
}

/** Regenera un únic dia dins la setmana (respecta la resta de dies). */
export function regenerateDayInWeek(
  week: WeeklyMenu,
  dateISO: string,
  input: Omit<PlannerInput, 'startDate'>,
): WeeklyMenu {
  const idx = week.days.findIndex((d) => d.date === dateISO);
  if (idx < 0) return week;
  const prev: Record<string, string | undefined> = {};
  if (idx > 0) updatePrevCarbs(prev, week.days[idx - 1]);
  const day = generateDay(dateISO, prev, { ...input, startDate: dateISO });
  const days = week.days.slice();
  days[idx] = day;
  return { ...week, days, generatedAt: new Date().toISOString() };
}

/** Dia planificat per a una data concreta (o undefined). */
export function getPlannedDay(week: WeeklyMenu | undefined, dateISO: string): PlannedDay | undefined {
  return week?.days.find((d) => d.date === dateISO);
}

/** Resum de la setmana (els dies tal qual, per a la vista general). */
export function getWeekOverview(week: WeeklyMenu | undefined): PlannedDay[] {
  return week?.days ?? [];
}

/** Munta els àpats resolts (amb id `day-<slot>`) d'un dia planificat, per abocar
 *  el pla setmanal al menú d'«Avui». Retorna null si el pla no conté aquesta data. */
export function buildDayMealsFromPlan(week: WeeklyMenu | undefined, dateISO: string): ResolvedMeal[] | null {
  const day = getPlannedDay(week, dateISO);
  if (!day) return null;
  const meals: ResolvedMeal[] = [];
  for (const m of day.meals) {
    const r = PLANNER_BY_ID[m.recipeId];
    if (r) meals.push(resolveRecipe(r, { id: `day-${m.slot}`, done: false, slot: m.slot }));
  }
  return meals.length ? meals : null;
}

/** Ingredients (nom + grams) d'un àpat planificat, per mostrar les quantitats. */
export function plannedMealItems(recipeId: string): { name: string; grams: number }[] {
  const r = PLANNER_BY_ID[recipeId];
  if (!r) return [];
  return r.ingredients.map((ing) => ({ name: getFood(ing.foodId)?.name ?? ing.foodId, grams: ing.grams }));
}

export { PLANNER_BY_ID, carbBaseOf, proteinOf };
