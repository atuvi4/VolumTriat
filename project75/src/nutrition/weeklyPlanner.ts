import type { MealRecipe, MealSlot, ResolvedMeal } from './nutritionTypes';
import { PLANNER_POOL } from './plannerRecipes';
import { slotMatchesRecipe } from './mealPlans';
import { resolveRecipe } from './mealBuilder';
import { getFood } from './foodDatabase';
import { toLocalISO } from '../utils/date';

/* =========================================================
   Weekly Nutrition Planner v2 — genera un menú setmanal amb varietat REAL,
   pensat per a volum (~3000 kcal / 150 g proteïna). Tot local, sense IA.
   Regles de varietat (pensa en la setmana sencera, no en un dia):
   - Memòria setmanal: compta quantes vegades ha sortit cada recepta, cada
     proteïna i cada base d'hidrats, i penalitza la reutilització de forma
     creixent (repetir recepta pesa MOLT; repetir proteïna/hidrat, gradualment).
   - Proteïna del dia: rotació setmanal (pollastre, vedella, salmó, gall dindi,
     porc, llegums, peix blanc…) barrejada de forma estable per setmana; el
     dinar tendeix a la proteïna del dia com faria un nutricionista.
   - No repetir la mateixa base d'hidrats ni proteïna dins el mateix dia.
   - Evitar la mateixa base i proteïna al mateix àpat que ahir.
   - L'snack tanca el dia acostant-se al target de calories, però sense repetir
     el mateix snack tota la setmana.
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
  rice_cooked: 'arròs', rice_brown: 'arròs', pasta_cooked: 'pasta',
  potato_cooked: 'patata', sweet_potato: 'moniato',
  bread: 'pa', bread_whole: 'pa', sliced_bread: 'pa', burger_bun: 'pa',
  oats: 'civada', couscous_cooked: 'cuscús', quinoa: 'quinoa', cereal: 'cereals',
  rice_cream: "crema d'arròs", tortilla_wrap: 'wrap', corn: 'blat de moro',
  lentils_cooked: 'llegums', chickpeas_cooked: 'llegums', white_beans: 'llegums',
};
const PROTEIN_SRC: Record<string, string> = {
  chicken_breast: 'pollastre', chicken_thigh: 'pollastre', burger_chicken: 'pollastre',
  turkey_breast: 'gall dindi',
  beef_lean: 'vedella', beef_steak: 'vedella', beef_mince_cooked: 'carn picada', burger_beef: 'vedella',
  pork_loin: 'porc', ham_cured: 'pernil', ham_cooked: 'pernil',
  tuna_can: 'tonyina', salmon: 'salmó', white_fish: 'peix blanc', sardines: 'sardines', prawns: 'marisc',
  egg: 'ous', egg_white: 'ous',
  lentils_cooked: 'llegums', chickpeas_cooked: 'llegums', white_beans: 'llegums',
  greek_yogurt: 'iogurt', protein_yogurt: 'iogurt proteic', cottage_cheese: 'formatge fresc',
  plain_yogurt: 'iogurt', whey: 'proteïna', milk_whole: 'làctic',
};

/** Rotació de "proteïna del dia" (com un nutricionista: cada dia una diferent). */
const FEATURED_PROTEINS = ['pollastre', 'vedella', 'salmó', 'gall dindi', 'porc', 'llegums', 'peix blanc'];

/* ---------- RNG amb llavor (varietat reproduïble quan cal) ---------- */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Proteïna destacada de cada dia (0..6 des de dilluns), barrejada de forma
 *  estable per setmana: la mateixa setmana sempre té la mateixa rotació. */
export function featuredProteinFor(weekStart: string, dayIndex: number): string {
  const rng = mulberry32(hashSeed(`feat-${weekStart}`));
  const order = FEATURED_PROTEINS.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[((dayIndex % order.length) + order.length) % order.length];
}

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

/** Memòria de la SETMANA: quantes vegades ha sortit cada recepta/proteïna/hidrat. */
interface WeekState {
  recipeCount: Map<string, number>;
  proteinCount: Map<string, number>;
  carbCount: Map<string, number>;
}

const emptyWeekState = (): WeekState => ({
  recipeCount: new Map(),
  proteinCount: new Map(),
  carbCount: new Map(),
});

const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

/** Context d'un dia dins la generació (memòria d'ahir + de la setmana + rng). */
interface DayContext {
  prevCarbBySlot: Record<string, string | undefined>;
  prevProteinBySlot: Record<string, string | undefined>;
  week: WeekState;
  featuredProtein?: string;
  rng: () => number;
}

const isLiquid = (r: MealRecipe): boolean => r.tags.includes('liquid_calories');

function register(st: DayState, week: WeekState, r: MealRecipe): void {
  st.usedRecipes.add(r.id);
  bump(week.recipeCount, r.id);
  const cb = carbBaseOf(r);
  const ps = proteinOf(r);
  if (cb) {
    st.carbs.add(cb);
    bump(week.carbCount, cb);
  }
  if (ps) {
    st.proteins.add(ps);
    bump(week.proteinCount, ps);
  }
  if (isLiquid(r)) st.liquid = true;
}

/** Penalització de varietat d'una recepta (dia + setmana). Com més ha sortit
 *  una recepta/proteïna/hidrat aquesta setmana, més puja — així la rotació
 *  s'estén a tota la setmana i no només al dia. */
function varietyScore(r: MealRecipe, slot: MealSlot, st: DayState, ctx: DayContext): number {
  const cb = carbBaseOf(r);
  const ps = proteinOf(r);
  let s = 0;
  // Dins del mateix dia.
  if (cb && st.carbs.has(cb)) s += cb === 'pasta' || cb === 'pa' ? 3 : 2;
  if (ps && st.proteins.has(ps)) s += 2;
  // Mateixa base/proteïna al mateix àpat que ahir (l'efecte "cada dia igual").
  if (cb && ctx.prevCarbBySlot[slot] === cb) s += 1.5;
  if (ps && ctx.prevProteinBySlot[slot] === ps) s += 2;
  // Memòria setmanal: penalització creixent per reutilització.
  s += 5 * (ctx.week.recipeCount.get(r.id) ?? 0); // repetir recepta pesa MOLT
  if (ps) s += 1.3 * (ctx.week.proteinCount.get(ps) ?? 0);
  if (cb) s += 0.9 * (ctx.week.carbCount.get(cb) ?? 0);
  // Màxim un batut/líquid al dia.
  if (isLiquid(r) && st.liquid) s += 4;
  // Proteïna del dia: el dinar tendeix a la proteïna destacada de la rotació.
  if (ps && ctx.featuredProtein && slot === 'dinar' && ps === ctx.featuredProtein) s -= 1.6;
  return s;
}

function pickMeal(slot: MealSlot, st: DayState, ctx: DayContext, dislikes: string[]): MealRecipe {
  const cands = poolForSlot(slot).filter((r) => !st.usedRecipes.has(r.id) && !isDisliked(r.name, dislikes));
  const list = cands.length ? cands : poolForSlot(slot);
  let best = list[0];
  let bestScore = Infinity;
  for (const r of list) {
    const s = varietyScore(r, slot, st, ctx) + ctx.rng() * 0.9; // desempat amb varietat
    if (s < bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return best;
}

function generateDay(dateISO: string, ctx: DayContext, input: PlannerInput): PlannedDay {
  const dislikes = input.dislikes ?? [];
  const targetKcal = input.targetKcal ?? DEFAULT_TARGET_KCAL;
  const st: DayState = { usedRecipes: new Set(), carbs: new Set(), proteins: new Set(), liquid: false };
  const meals: PlannedMeal[] = [];
  let kcal = 0;
  let protein = 0;

  for (const slot of MAIN_SLOTS) {
    const r = pickMeal(slot, st, ctx, dislikes);
    register(st, ctx.week, r);
    const n = recipeNut(r);
    meals.push({ slot, recipeId: r.id, name: r.name, kcal: n.kcal, protein: n.protein });
    kcal += n.kcal;
    protein += n.protein;
  }

  // Snack: tanca el dia acostant-se al target de kcal, però amb la mateixa
  // memòria setmanal — el "millor" snack no pot ser el mateix cada dia.
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
    err += 220 * (ctx.week.recipeCount.get(r.id) ?? 0); // no repetir el mateix snack tota la setmana
    if (ps) err += 40 * (ctx.week.proteinCount.get(ps) ?? 0);
    if (isLiquid(r) && st.liquid) err += 400; // no un segon batut si ja n'hi ha un
    if (err < bestErr) {
      bestErr = err;
      bestSnack = r;
    }
  }
  const sn = recipeNut(bestSnack);
  register(st, ctx.week, bestSnack);
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

function updatePrevBySlot(
  prevCarb: Record<string, string | undefined>,
  prevProtein: Record<string, string | undefined>,
  day: PlannedDay,
): void {
  for (const m of day.meals) {
    const r = PLANNER_BY_ID[m.recipeId];
    if (!r) continue;
    const cb = carbBaseOf(r);
    const ps = proteinOf(r);
    if (cb) prevCarb[m.slot] = cb;
    if (ps) prevProtein[m.slot] = ps;
  }
}

/** Acumula un dia ja planificat a la memòria setmanal. */
function registerDayInWeekState(week: WeekState, day: PlannedDay): void {
  for (const m of day.meals) {
    const r = PLANNER_BY_ID[m.recipeId];
    if (!r) continue;
    bump(week.recipeCount, r.id);
    const cb = carbBaseOf(r);
    const ps = proteinOf(r);
    if (cb) bump(week.carbCount, cb);
    if (ps) bump(week.proteinCount, ps);
  }
}

/** Genera un menú de 7 dies (dilluns→diumenge) de la setmana de `startDate`. */
export function generateWeeklyMenu(input: PlannerInput): WeeklyMenu {
  const start = weekStartISO(input.startDate);
  const prevCarbBySlot: Record<string, string | undefined> = {};
  const prevProteinBySlot: Record<string, string | undefined> = {};
  const week = emptyWeekState();
  const days: PlannedDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const ctx: DayContext = {
      prevCarbBySlot, prevProteinBySlot, week,
      featuredProtein: featuredProteinFor(start, i),
      rng: Math.random, // cada "Regenerar setmana" dona una setmana nova
    };
    const day = generateDay(toLocalISO(d), ctx, input);
    updatePrevBySlot(prevCarbBySlot, prevProteinBySlot, day);
    days.push(day);
  }
  return { weekStartISO: start, days, generatedAt: new Date().toISOString() };
}

/** Regenera un únic dia dins la setmana, respectant la resta: la memòria
 *  setmanal es reconstrueix amb els ALTRES dies perquè el dia nou no repeteixi
 *  el que ja menges la resta de la setmana. */
export function regenerateDayInWeek(
  week: WeeklyMenu,
  dateISO: string,
  input: Omit<PlannerInput, 'startDate'>,
): WeeklyMenu {
  const idx = week.days.findIndex((d) => d.date === dateISO);
  if (idx < 0) return week;
  const prevCarb: Record<string, string | undefined> = {};
  const prevProtein: Record<string, string | undefined> = {};
  if (idx > 0) updatePrevBySlot(prevCarb, prevProtein, week.days[idx - 1]);
  const wk = emptyWeekState();
  for (let i = 0; i < week.days.length; i++) {
    if (i !== idx) registerDayInWeekState(wk, week.days[i]);
  }
  const ctx: DayContext = {
    prevCarbBySlot: prevCarb, prevProteinBySlot: prevProtein, week: wk,
    featuredProtein: featuredProteinFor(week.weekStartISO, idx),
    rng: Math.random,
  };
  const day = generateDay(dateISO, ctx, { ...input, startDate: dateISO });
  const days = week.days.slice();
  days[idx] = day;
  return { ...week, days, generatedAt: new Date().toISOString() };
}

/** Dia de RESERVA quan cap pla setmanal cobreix la data: un dia variat i
 *  DETERMINISTA per data (mateix dia → mateix menú entre recàrregues), amb
 *  la proteïna del dia de la rotació setmanal. Substitueix l'antic dia fix
 *  idèntic cada dia. */
export function buildFallbackDayMeals(
  dateISO: string,
  opts: { dislikes?: string[]; targetKcal?: number; targetProtein?: number } = {},
): ResolvedMeal[] {
  const start = weekStartISO(dateISO);
  const dayIndex = Math.max(
    0,
    Math.round((new Date(dateISO + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()) / 86400000),
  );
  const ctx: DayContext = {
    prevCarbBySlot: {},
    prevProteinBySlot: {},
    week: emptyWeekState(),
    featuredProtein: featuredProteinFor(start, dayIndex),
    rng: mulberry32(hashSeed(`day-${dateISO}`)),
  };
  const day = generateDay(dateISO, ctx, { startDate: dateISO, ...opts });
  const meals: ResolvedMeal[] = [];
  for (const m of day.meals) {
    const r = PLANNER_BY_ID[m.recipeId];
    if (r) meals.push(resolveRecipe(r, { id: `day-${m.slot}`, done: false, slot: m.slot }));
  }
  return meals;
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
