import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, CheckIn, Goal, PersonalIngredient, PersonalItem, Profile, Ritme, SavedProduct, Tab } from '../types';
import { computeTargets } from '../nutrition/nutritionTargets';
import { generateWeeklyMenu, regenerateDayInWeek, buildDayMealsFromPlan, type WeeklyMenu } from '../nutrition/weeklyPlanner';
import type { AdjustContext, ManualLog, MealRecipe, MealSlot, ResolvedMeal } from '../nutrition/nutritionTypes';
import type { PurchaseMealSnapshot } from '../nutrition/mealPurchaseAI';
import { DEFAULT_PROFILE } from '../data/program';
import { defaultDayRecipes, RECIPE_POOL, SHAKE_RECIPES } from '../nutrition/mealPlans';
import { resolveRecipe } from '../nutrition/mealBuilder';
import { addDaysISO, todayISO } from '../utils/date';
import { doneCount, mealEaten } from '../utils/goals';
import { isStarted } from '../utils/project';
import { detectReadOnly } from '../utils/readOnly';
import { resolveTodayTraining } from '../data/week';
import { appendOutcome } from '../brain/brain';
import type { MealOutcome, OutcomeAction, OutcomeSource } from '../brain/brainTypes';
import { stateKeyFor } from '../utils/storageKeys';
import { pickInitialRaw } from '../utils/stateMigration';
import { emptyState, STARTER_PROFILE } from '../data/emptyState';
import { backfillHistoryFromOutcomes, pruneHistory, buildDailyLog } from '../history/dailyLog';
import { useAuth } from '../auth/useAuth';
import { writeLocalBackup, writePreviousBackup } from '../utils/dataSafety';
import { useCloud, type CloudSlice } from '../cloud/useCloud';

// AMIX Anabolic Masster — presa de 50 g amb aigua (etiqueta: 366 kcal / 45 g prot per 100 g).
const DEFAULT_ANABOLIC = { kcal: 183, protein: 23 };

function buildDayMeals(): ResolvedMeal[] {
  return defaultDayRecipes().map((r) => resolveRecipe(r, { id: `day-${r.slot}`, done: false }));
}

/** Àpats d'un dia: del pla setmanal si el conté, si no del pla base. */
function dayMealsFor(dateISO: string, plan?: WeeklyMenu): ResolvedMeal[] {
  return buildDayMealsFromPlan(plan, dateISO) ?? buildDayMeals();
}

/** Reset diari en canviar de dia (única lògica, usada en carregar i amb l'app
 *  oberta). Ratxa HONESTA: si ahir no es va completar, torna a zero — una
 *  ratxa que mai es trenca no diu res. La constància (completedDates) no es toca. */
function rolloverToToday(s: AppState): AppState {
  const yesterday = addDaysISO(todayISO(), -1);
  const keepStreak = !isStarted(s.profile.projectStartDate) || s.lastComplete === yesterday;
  // History v1: congela el dia que s'acaba (amb el seu estat FINAL: àpats,
  // extres, objectius del dia, mode, entrenament) abans de resetejar res.
  const history = pruneHistory({ ...(s.history ?? {}), [s.date]: buildDailyLog(s) });
  return {
    ...s,
    history,
    date: todayISO(),
    streak: keepStreak ? s.streak : 0,
    meals: dayMealsFor(todayISO(), s.weeklyPlan),
    gymDone: false,
    checkin: null,
    dayMode: 'normal',
  };
}

/** Aboca el menú planificat d'avui als àpats PENDENTS, sense tocar els que ja
 *  s'han marcat/canviat/registrat (done/changed/partial/skipped) ni els extres. */
function mergePlanIntoToday(current: ResolvedMeal[], plan: WeeklyMenu): ResolvedMeal[] {
  const planMeals = buildDayMealsFromPlan(plan, todayISO());
  if (!planMeals) return current;
  const bySlot = new Map(planMeals.map((m) => [m.slot, m]));
  const replaceable = (m: ResolvedMeal) =>
    !m.isExtra &&
    typeof m.id === 'string' &&
    m.id.startsWith('day-') &&
    !m.done &&
    (m.status ?? 'pending') === 'pending';
  return current.map((m) => (replaceable(m) && bySlot.has(m.slot) ? bySlot.get(m.slot)! : m));
}

/** Project75 Brain v1 — registra un outcome real amb el context actual. */
function withOutcome(
  s: AppState,
  o: {
    slot: MealOutcome['slot'];
    mealName: string;
    recipeId?: string;
    action: OutcomeAction;
    kcal?: number;
    protein?: number;
    source?: OutcomeSource;
    confidence?: MealOutcome['confidence'];
    reason?: string;
  },
): AppState {
  const outcome: MealOutcome = {
    id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayISO(),
    timestamp: new Date().toISOString(),
    slot: o.slot,
    mealName: o.mealName,
    recipeId: o.recipeId,
    action: o.action,
    kcal: o.kcal,
    protein: o.protein,
    source: o.source,
    confidence: o.confidence,
    appetite: s.checkin?.appetite,
    dayMode: s.dayMode,
    // Sessió REAL del dia (respecta la setmana d'adaptació), no la plantilla.
    training: resolveTodayTraining(s.profile.projectStartDate).workout.type,
    reason: o.reason,
  };
  return { ...s, outcomes: appendOutcome(s.outcomes ?? [], outcome) };
}

/** Estat inicial d'un dispositiu NOU sense login: perfil neutre i onboarding
 *  pendent (mai el perfil d'un altre usuari). Els estats ja desats no canvien:
 *  aquesta funció només s'executa quan no hi ha res a localStorage. */
function freshState(): AppState {
  return {
    version: 3,
    date: todayISO(),
    streak: 0, // res de ratxes fins que comenci de veritat
    lastComplete: null,
    dayMode: 'normal',
    meals: buildDayMeals(),
    gymDone: false,
    checkin: null,
    dislikes: [],
    weights: [], // cap pes inventat
    completedDates: [],
    prepDone: [],
    outcomes: [],
    gymDates: [],
    supplements: { creatineDates: [], anabolicServing: { ...DEFAULT_ANABOLIC } },
    profile: { ...STARTER_PROFILE },
  };
}

const DAY_SLOTS: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];

/** Control de plausibilitat d'una dada manual abans de desar-la com a habitual. */
function isPlausibleManual(kcal: number, protein: number): boolean {
  if (!Number.isFinite(kcal) || kcal <= 0 || kcal > 2500) return false;
  if (!Number.isFinite(protein) || protein < 0 || protein > 250) return false;
  if (protein * 4 > kcal * 1.15 + 25) return false; // la proteïna no pot superar les kcal
  return true;
}

/** Catàleg personal: desa/actualitza un àpat manual amb nom com a «habitual».
 *  Només si té nom i passa el control de plausibilitat (mai desa soroll). */
function rememberPersonal(items: PersonalItem[] = [], data: ManualLog, slot?: MealSlot): PersonalItem[] {
  const name = (data.name ?? '').trim();
  if (name.length < 2 || !isPlausibleManual(data.kcal, data.protein)) return items;
  const key = name.toLowerCase();
  const now = new Date().toISOString();
  const idx = items.findIndex((it) => it.name.toLowerCase() === key);
  if (idx >= 0) {
    const next = items.slice();
    next[idx] = { ...next[idx], kcal: data.kcal, protein: data.protein, slot: slot ?? next[idx].slot, count: next[idx].count + 1, lastUsedAt: now };
    return next;
  }
  const item: PersonalItem = { id: `pi-${Date.now()}`, name, kcal: data.kcal, protein: data.protein, slot, count: 1, lastUsedAt: now };
  return [...items, item].slice(-50); // límit raonable
}

/** Repara el slot d'un àpat planificat a partir del seu id `day-<slot>`. Corregeix
 *  dades antigues on canviar la recepta va sobreescriure el slot (p. ex. un sopar
 *  que va quedar marcat com «dinar»). No toca extres. */
function repairMealSlots(meals: ResolvedMeal[]): ResolvedMeal[] {
  return meals.map((m) => {
    if (!m || m.isExtra || typeof m.id !== 'string' || !m.id.startsWith('day-')) return m;
    const slot = m.id.slice(4) as MealSlot;
    return DAY_SLOTS.includes(slot) && m.slot !== slot ? { ...m, slot } : m;
  });
}

/** Normalitza un estat (importat o carregat) sense esborrar dades: omple camps
 *  nous, arregla àpats invàlids i garanteix arrays. No fa reset per canvi de dia. */
function normalizeState(s: AppState): AppState {
  s.profile = { ...DEFAULT_PROFILE, ...s.profile };
  if (!Array.isArray(s.meals) || s.meals.some((m) => !m || !m.nutrition)) s.meals = buildDayMeals();
  s.meals = repairMealSlots(s.meals);
  s.completedDates = s.completedDates ?? [];
  s.prepDone = s.prepDone ?? [];
  s.outcomes = s.outcomes ?? [];
  s.gymDates = s.gymDates ?? [];
  s.savedProducts = s.savedProducts ?? [];
  s.dislikes = s.dislikes ?? [];
  s.weights = s.weights ?? [];
  s.version = s.version ?? 3;
  s.date = s.date ?? todayISO();
  s.dayMode = s.dayMode ?? 'normal';
  s.streak = s.streak ?? 0;
  s.lastComplete = s.lastComplete ?? null;
  s.gymDone = s.gymDone ?? false;
  s.checkin = s.checkin ?? null;
  s.supplements = s.supplements ?? { creatineDates: [] };
  s.supplements.creatineDates = s.supplements.creatineDates ?? [];
  s.supplements.anabolicServing = s.supplements.anabolicServing ?? { ...DEFAULT_ANABOLIC };
  // History v1: backfill únic des dels outcomes si l'estat encara no en té.
  s.history = s.history ?? backfillHistoryFromOutcomes(s);
  return s;
}

function loadState(userId: string | null): AppState {
  try {
    const raw = pickInitialRaw(userId, localStorage);
    if (!raw) return userId ? emptyState() : freshState();
    let s = JSON.parse(raw) as AppState;
    // Data Safety: desa una còpia crua ABANS de migrar (xarxa de seguretat si
    // una migració/deploy trenca l'estat). No escriure en mode visita.
    if (!detectReadOnly()) writePreviousBackup(s);
    s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    // History v1: backfill ABANS del rollover (si no, el rollover crearia un
    // history d'una sola entrada i els dies antics dels outcomes es perdrien).
    s.history = s.history ?? backfillHistoryFromOutcomes(s);
    if (s.date !== todayISO()) s = rolloverToToday(s);
    if (!Array.isArray(s.meals) || s.meals.some((m) => !m || !m.nutrition)) {
      s.meals = dayMealsFor(todayISO(), s.weeklyPlan);
    }
    s.meals = repairMealSlots(s.meals); // corregeix slots antics (sopar marcat com dinar, etc.)
    s.completedDates = s.completedDates ?? [];
    s.prepDone = s.prepDone ?? [];
    s.outcomes = s.outcomes ?? []; // Brain v1: acumula entre dies (no es reinicia)
    s.gymDates = s.gymDates ?? []; // historial d'entrenament (persisteix entre dies)
    s.savedProducts = s.savedProducts ?? []; // productes d'etiqueta confirmats
    s.supplements = s.supplements ?? { creatineDates: [] };
    s.supplements.creatineDates = s.supplements.creatineDates ?? [];
    s.supplements.anabolicServing = s.supplements.anabolicServing ?? { ...DEFAULT_ANABOLIC };
    // no barrejar mock: elimina pesos anteriors a la data d'inici
    s.weights = (s.weights ?? []).filter((w) => w.d >= s.profile.projectStartDate);
    return s;
  } catch {
    return userId ? emptyState() : freshState();
  }
}

/** Dades que recull la configuració inicial (onboarding) d'un usuari nou. */
export interface OnboardingInput {
  name?: string;
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  startWeight: number;
  goal: Goal;
  ritme: Ritme;
}

interface Ctx extends CloudSlice {
  state: AppState;
  tab: Tab;
  setTab: (t: Tab) => void;
  toast: string | null;
  showToast: (m: string) => void;
  sheet: ReactNode | null;
  openSheet: (n: ReactNode) => void;
  closeSheet: () => void;
  /** Mode visita actiu (URL ?demo=1 / ?readonly=1 / ?view=demo). Bloqueja edicions. */
  isReadOnly: boolean;
  markMeal: (id: string) => void;
  changeMeal: (id: string, data: ManualLog) => void;
  partialMeal: (id: string, pct: number) => void;
  skipMeal: (id: string) => void;
  undoMeal: (id: string) => void;
  addExtra: (data: ManualLog) => void;
  addAdjustment: (ctx: AdjustContext, recipe?: MealRecipe) => void;
  removeExtra: (id: string) => void;
  swapMeal: (id: string, recipe: MealRecipe) => void;
  /** Substitueix la proposta de l'àpat per una opció de compra (IA), mantenint-lo
   *  PENDENT. No compta calories fins que es marqui «Fet». No registra outcome. */
  replaceMealWithPurchaseOption: (id: string, snap: PurchaseMealSnapshot) => void;
  dislikeMeal: (id: string) => void;
  addRecipe: (recipe: MealRecipe) => void;
  regenerateDay: () => void;
  addShake: () => void;
  markGym: () => void;
  setDayMode: (m: AppState['dayMode']) => void;
  toggleHardDay: () => void;
  toggleLowAppetite: () => void;
  submitCheckin: (c: Omit<CheckIn, 'at'>) => void;
  addWeight: (kg: number) => void;
  updateProfile: (p: Partial<Profile>) => void;
  /** Configuració inicial: calcula i desa els objectius de l'usuari i marca onboarded. */
  completeOnboarding: (input: OnboardingInput) => void;
  setProjectStartDate: (iso: string) => void;
  startToday: () => void;
  togglePrep: (id: string) => void;
  resetAll: () => void;
  /** Data Safety: importa/restaura un estat complet (fitxer o backup local). */
  importState: (next: AppState) => void;
  /** Suplements: marca/desmarca la creatina d'avui. */
  toggleCreatine: () => void;
  /** Suplements: desa les macros per cassó de l'Anabolic Master (etiqueta). */
  saveAnabolicServing: (kcal: number, protein: number) => void;
  /** Weekly Planner: genera/regenera el menú setmanal (no toca el menú d'avui). */
  generateWeek: () => void;
  regenerateWeekDay: (dateISO: string) => void;
  /** Desa un ingredient propi (macros d'etiqueta) per reutilitzar al compositor. */
  savePersonalIngredient: (name: string, kcalPer100g: number, proteinPer100g: number) => void;
  /** Label Scanner: desa un producte real amb macros d'etiqueta CONFIRMADES. */
  saveProductFromLabel: (p: {
    name: string;
    kcalPer100g: number;
    proteinPer100g: number;
    carbsPer100g?: number;
    fatPer100g?: number;
    servingGrams?: number;
  }) => void;
  removeSavedProduct: (id: string) => void;
  /** Registra N grams d'un producte guardat com a extra (kcal calculades). */
  registerSavedProduct: (id: string, grams: number) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<AppState>(() => loadState(userId));
  const [tab, setTab] = useState<Tab>('avui');
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ReactNode | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [isReadOnly] = useState(detectReadOnly);

  useEffect(() => {
    // En mode visita no escrivim res: no toquem les dades del dispositiu.
    if (isReadOnly) return;
    localStorage.setItem(stateKeyFor(userId), JSON.stringify(state));
    writeLocalBackup(state); // còpia «última» a cada desada (Data Safety)
  }, [state, isReadOnly, userId]);

  useEffect(() => {
    // Canvi de dia amb l'app OBERTA (mòbil que passa la mitjanit sense recarregar):
    // aplica el mateix reset diari que fa loadState en arrencar. Si no ha canviat
    // el dia, retorna el mateix estat i no hi ha re-render.
    const checkDayChange = () => {
      setState((s) => (s.date === todayISO() ? s : rolloverToToday(s)));
    };
    document.addEventListener('visibilitychange', checkDayChange);
    window.addEventListener('focus', checkDayChange);
    const timer = window.setInterval(checkDayChange, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', checkDayChange);
      window.removeEventListener('focus', checkDayChange);
      window.clearInterval(timer);
    };
  }, []);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const openSheet = useCallback((n: ReactNode) => setSheet(n), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const bumpStreak = useCallback((next: AppState): AppState => {
    // La ratxa i la constància només compten des de la data d'inici
    if (!isStarted(next.profile.projectStartDate)) return next;
    const need = next.dayMode === 'dificil' ? 1 : 3;
    if (doneCount(next.meals) >= need && next.lastComplete !== todayISO()) {
      const completedDates = next.completedDates.includes(todayISO())
        ? next.completedDates
        : [...next.completedDates, todayISO()];
      return { ...next, streak: next.streak + 1, lastComplete: todayISO(), completedDates };
    }
    return next;
  }, []);

  const markMeal = useCallback(
    (id: string) => {
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        const meals = s.meals.map((m) =>
          m.id === id
            ? { ...m, done: true, status: 'done' as const, logged: undefined, partialPct: undefined }
            : m,
        );
        let next = bumpStreak({ ...s, meals });
        if (meal)
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'done',
            kcal: meal.nutrition.kcal, protein: meal.nutrition.protein, source: 'recipe', confidence: meal.confidence,
          });
        return next;
      });
      showToast('Àpat fet');
    },
    [bumpStreak, showToast],
  );

  const changeMeal = useCallback(
    (id: string, data: ManualLog) => {
      const keepPending = data.eaten === false; // no marcar-lo com a menjat encara
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        const withTags = (m: ResolvedMeal) =>
          data.isShake ? Array.from(new Set([...m.tags, 'liquid_calories' as const])) : m.tags;

        if (keepPending) {
          // Actualitza el CONTINGUT de l'àpat i el deixa PENDENT: no suma ni compta
          // fins que marquis «Fet». Sense outcome (encara no s'ha menjat).
          // Es conserva `logged` (nom/nota amb els grams del compositor) perquè
          // el detall no es perdi; com que l'estat és pending, NO compta.
          return {
            ...s,
            meals: s.meals.map((m) =>
              m.id === id
                ? {
                    ...m,
                    name: data.name?.trim() || m.name,
                    recipeId: undefined,
                    nutrition: { kcal: data.kcal, protein: data.protein, carbs: 0, fat: 0, fiber: 0 },
                    precision: 'manual_estimate' as const,
                    confidence: 'low' as const,
                    sources: ['manual_estimate' as const],
                    ingredients: [],
                    tags: withTags(m),
                    status: 'pending' as const,
                    done: false,
                    logged: { ...data },
                    partialPct: undefined,
                  }
                : m,
            ),
          };
        }

        let next = bumpStreak({
          ...s,
          meals: s.meals.map((m) =>
            m.id === id
              ? { ...m, done: false, status: 'changed' as const, logged: { ...data }, partialPct: undefined, tags: withTags(m) }
              : m,
          ),
          personalItems: rememberPersonal(s.personalItems, data, meal?.slot),
        });
        if (meal)
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'changed',
            kcal: data.kcal, protein: data.protein, source: 'manual', confidence: 'low',
          });
        return next;
      });
      showToast(keepPending ? 'Àpat actualitzat · marca «Fet» quan te’l mengis' : 'Àpat canviat · dada manual');
    },
    [bumpStreak, showToast],
  );

  const partialMeal = useCallback(
    (id: string, pct: number) => {
      const p = Math.max(1, Math.min(100, Math.round(pct)));
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        let next = bumpStreak({
          ...s,
          meals: s.meals.map((m) =>
            m.id === id
              ? { ...m, done: false, status: 'partial' as const, partialPct: p, logged: undefined }
              : m,
          ),
        });
        if (meal) {
          const f = p / 100;
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'partial',
            kcal: Math.round(meal.nutrition.kcal * f), protein: Math.round(meal.nutrition.protein * f),
            source: 'partial_estimate', confidence: meal.confidence, reason: `${p}%`,
          });
        }
        return next;
      });
      showToast(`Ració parcial · ${p}%`);
    },
    [bumpStreak, showToast],
  );

  const skipMeal = useCallback(
    (id: string) => {
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        let next: AppState = {
          ...s,
          meals: s.meals.map((m) =>
            m.id === id
              ? { ...m, done: false, status: 'skipped' as const, logged: undefined, partialPct: undefined }
              : m,
          ),
        };
        if (meal)
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'skipped',
          });
        return next;
      });
      showToast('Àpat saltat · sense culpa, recalculo');
    },
    [showToast],
  );

  const undoMeal = useCallback(
    (id: string) => {
      // Àpats AFEGITS (extra, batut, recepta extra: id que no comença per 'day-')
      // es treuen del tot. Els planificats del dia tornen a pendent.
      const added = !id.startsWith('day-');
      setState((s) => {
        const m = s.meals.find((x) => x.id === id);
        // Compensació al Brain: si constava com a menjat, resta'l de l'historial
        // (sense això, fet→desfer→fet inflaria les kcal del dia a Evolució).
        const eaten = m ? mealEaten(m) : null;
        let next: AppState =
          m && (m.isExtra || added)
            ? { ...s, meals: s.meals.filter((x) => x.id !== id) }
            : {
                ...s,
                meals: s.meals.map((x) =>
                  x.id === id
                    ? { ...x, done: false, status: 'pending' as const, logged: undefined, partialPct: undefined }
                    : x,
                ),
              };
        if (m && eaten)
          next = withOutcome(next, {
            slot: m.slot, mealName: m.name, recipeId: m.recipeId, action: 'undone',
            kcal: eaten.kcal, protein: eaten.protein,
          });
        return next;
      });
      showToast(added ? 'Àpat tret' : 'Estat esborrat');
    },
    [showToast],
  );

  const addExtra = useCallback(
    (data: ManualLog) => {
      const extra: ResolvedMeal = {
        id: `extra-${Date.now()}`,
        slot: 'snack',
        name: data.name?.trim() || 'Extra',
        done: false,
        status: 'changed',
        isExtra: true,
        extraOrigin: 'manual',
        createdAt: new Date().toISOString(),
        logged: { ...data },
        tags: data.isShake ? ['liquid_calories'] : [],
        nutrition: { kcal: data.kcal, protein: data.protein, carbs: 0, fat: 0, fiber: 0 },
        precision: 'manual_estimate',
        confidence: 'low',
        sources: ['manual_estimate'],
        ingredients: [],
      };
      setState((s) =>
        withOutcome(
          bumpStreak({ ...s, meals: [...s.meals, extra], personalItems: rememberPersonal(s.personalItems, data, 'snack') }),
          {
            slot: 'snack', mealName: extra.name, action: 'extra',
            kcal: data.kcal, protein: data.protein, source: 'manual', confidence: 'low',
          },
        ),
      );
      showToast('Extra afegit · dada manual');
    },
    [bumpStreak, showToast],
  );

  /** Ajust afegit des de «Ajust per arribar avui»: batut/snack (recepta calculada)
   *  amb metadata del canvi que l'ha provocat, perquè sigui reversible i contextual. */
  const addAdjustment = useCallback(
    (ctx: AdjustContext, recipe?: MealRecipe) => {
      const r = recipe ?? SHAKE_RECIPES[Math.floor(Math.random() * SHAKE_RECIPES.length)];
      const base = resolveRecipe(r, { id: `adj-${Date.now()}`, done: true });
      const extra: ResolvedMeal = {
        ...base,
        isExtra: true,
        extraOrigin: 'adjustment',
        relatedMealId: ctx.relatedMealId,
        relatedMealStatus: ctx.relatedMealStatus,
        suggestedAfterMealId: ctx.suggestedAfterMealId,
        suggestedTiming: ctx.suggestedTiming,
        createdAt: new Date().toISOString(),
      };
      setState((s) =>
        withOutcome(bumpStreak({ ...s, meals: [...s.meals, extra] }), {
          slot: base.slot, mealName: base.name, recipeId: base.recipeId, action: 'adjustment_added',
          kcal: base.nutrition.kcal, protein: base.nutrition.protein, source: 'recipe', confidence: base.confidence,
          reason: ctx.relatedMealStatus ?? ctx.suggestedTiming,
        }),
      );
      setTab('nutri');
      showToast('Ajust afegit · el pots treure quan vulguis');
    },
    [bumpStreak, showToast],
  );

  const removeExtra = useCallback(
    (id: string) => {
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        const eaten = meal ? mealEaten(meal) : null;
        let next: AppState = { ...s, meals: s.meals.filter((m) => m.id !== id) };
        if (meal?.isExtra && meal.extraOrigin === 'adjustment')
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId,
            action: 'adjustment_removed', reason: meal.relatedMealStatus,
          });
        // Compensació: si l'extra constava com a menjat, resta'l de l'historial.
        if (meal && eaten)
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'undone',
            kcal: eaten.kcal, protein: eaten.protein,
          });
        return next;
      });
      showToast('Extra eliminat');
    },
    [showToast],
  );

  const swapMeal = useCallback(
    (id: string, recipe: MealRecipe) => {
      setState((s) => ({
        ...s,
        meals: s.meals.map((m) => (m.id === id ? resolveRecipe(recipe, { id: m.id, done: m.done, slot: m.slot }) : m)),
      }));
      showToast('Àpat canviat');
    },
    [showToast],
  );

  const replaceMealWithPurchaseOption = useCallback(
    (id: string, snap: PurchaseMealSnapshot) => {
      setState((s) => ({
        ...s,
        meals: s.meals.map((m) =>
          m.id === id
            ? {
                ...m,
                name: snap.name,
                recipeId: undefined,
                nutrition: snap.nutrition,
                confidence: snap.confidence,
                precision: snap.precision,
                sources: snap.sources,
                tags: snap.tags,
                ingredients: snap.ingredients,
                originNote: snap.originNote,
                // Segueix PENDENT: no menjat, no suma fins «Fet».
                status: 'pending' as const,
                done: false,
                logged: undefined,
                partialPct: undefined,
              }
            : m,
        ),
      }));
      // Cap outcome: substituir la proposta no és una acció menjada (Brain intacte).
      showToast('Proposta substituïda · encara no compta fins que marquis «Fet»');
    },
    [showToast],
  );

  const dislikeMeal = useCallback(
    (id: string) => {
      setState((s) => {
        const m = s.meals.find((x) => x.id === id);
        const food = m?.ingredients[0]?.name ?? '';
        const dislikes = food && !s.dislikes.includes(food) ? [...s.dislikes, food] : s.dislikes;
        showToast(`Anotat — proposaré «${food.toLowerCase()}» menys sovint`);
        let next: AppState = { ...s, dislikes };
        if (m)
          next = withOutcome(next, {
            slot: m.slot, mealName: m.name, recipeId: m.recipeId, action: 'disliked', reason: food || undefined,
          });
        return next;
      });
    },
    [showToast],
  );

  const addRecipe = useCallback(
    (recipe: MealRecipe) => {
      setState((s) =>
        bumpStreak({
          ...s,
          meals: [...s.meals, resolveRecipe(recipe, { id: `x-${recipe.id}-${Date.now()}`, done: true })],
        }),
      );
      showToast('Ingesta afegida i comptada');
    },
    [bumpStreak, showToast],
  );

  const addShake = useCallback(() => {
    const r = SHAKE_RECIPES[Math.floor(Math.random() * SHAKE_RECIPES.length)];
    setState((s) =>
      bumpStreak({
        ...s,
        meals: [...s.meals, resolveRecipe(r, { id: `sh-${Date.now()}`, done: true })],
      }),
    );
    setTab('nutri');
    showToast('Batut afegit i comptat');
  }, [bumpStreak, showToast]);

  const regenerateDay = useCallback(() => {
    setState((s) => {
      const slots: ResolvedMeal['slot'][] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];
      const pool = RECIPE_POOL.filter(
        (r) => !s.dislikes.some((d) => r.name.toLowerCase().includes(d.toLowerCase())),
      );
      const meals = slots.map((slot, i) => {
        const candidates = pool.filter((r) => r.slot === slot);
        const list = candidates.length ? candidates : pool.length ? pool : RECIPE_POOL;
        const r = list[Math.floor(Math.random() * list.length)];
        return resolveRecipe(r, { id: `day-${slot}-${i}`, done: false });
      });
      return { ...s, meals };
    });
    showToast('Menú del dia regenerat');
  }, [showToast]);

  const markGym = useCallback(() => {
    setState((s) => ({
      ...s,
      gymDone: true,
      // Historial persistent (gymDone es reinicia cada nit i es perdria).
      gymDates: (s.gymDates ?? []).includes(todayISO()) ? s.gymDates : [...(s.gymDates ?? []), todayISO()],
    }));
    showToast('Sessió registrada');
  }, [showToast]);

  const setDayMode = useCallback((m: AppState['dayMode']) => {
    setState((s) => ({ ...s, dayMode: m }));
  }, []);

  const toggleHardDay = useCallback(() => {
    setState((s) => {
      const next = s.dayMode === 'dificil' ? 'normal' : 'dificil';
      showToast(next === 'dificil' ? 'Mode dia difícil: exigència al mínim' : 'Tornem al pla normal');
      return { ...s, dayMode: next };
    });
    setTab('avui');
  }, [showToast]);

  const toggleLowAppetite = useCallback(() => {
    setState((s) => {
      const next = s.dayMode === 'pocaGana' ? 'normal' : 'pocaGana';
      showToast(next === 'pocaGana' ? 'Mode poca gana: prioritzo líquids' : 'Tornem al pla normal');
      return { ...s, dayMode: next };
    });
  }, [showToast]);

  const submitCheckin = useCallback(
    (c: Omit<CheckIn, 'at'>) => {
      setState((s) => {
        let dayMode = s.dayMode;
        if (c.mood === 'low') dayMode = 'dificil';
        else if (c.appetite === 'poca') dayMode = 'pocaGana';
        return { ...s, checkin: { ...c, at: new Date().toISOString() }, dayMode };
      });
      if (c.mood === 'low') showToast('Dia fluix detectat — activo mode dia difícil');
      else if (c.appetite === 'poca') showToast('Poca gana — prioritzo calories líquides');
      else if (c.energy === 'low') showToast('Poca energia: valora moure el cardio dur');
      else showToast('Check-in desat · dia per empènyer');
    },
    [showToast],
  );

  const addWeight = useCallback(
    (kg: number) => {
      // Mai fabriquem un pes: cal un valor real i vàlid.
      if (!Number.isFinite(kg) || kg <= 0) return;
      setState((s) => ({ ...s, weights: [...s.weights, { d: todayISO(), kg }] }));
      showToast('Pes registrat');
    },
    [showToast],
  );

  const updateProfile = useCallback(
    (p: Partial<Profile>) => {
      setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
      showToast('Canvis desats');
    },
    [showToast],
  );

  const completeOnboarding = useCallback(
    (input: OnboardingInput) => {
      const t = computeTargets({
        sex: input.sex,
        age: input.age,
        heightCm: input.heightCm,
        weightKg: input.startWeight,
        ritme: input.ritme,
        goal: input.goal,
      });
      setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          name: input.name?.trim() || s.profile.name,
          sex: input.sex,
          age: input.age,
          heightCm: input.heightCm,
          startWeight: input.startWeight,
          ritme: input.ritme,
          goal: input.goal,
          kcalGoal: t.kcalStart,
          protGoal: Math.max(t.proteinGrams, 120),
          target1: input.startWeight,
          target2: input.startWeight,
          onboarded: true,
        },
        // Registra el pes inicial si encara no n'hi ha cap.
        weights: s.weights.length ? s.weights : [{ d: todayISO(), kg: input.startWeight }],
      }));
      setTab('avui');
      showToast('Perfil configurat · objectius calculats');
    },
    [showToast],
  );

  const setProjectStartDate = useCallback(
    (iso: string) => {
      setState((s) => ({ ...s, profile: { ...s.profile, projectStartDate: iso } }));
      showToast('Data d’inici actualitzada');
    },
    [showToast],
  );

  const startToday = useCallback(() => {
    setState((s) => ({ ...s, profile: { ...s.profile, projectStartDate: todayISO() } }));
    setTab('avui');
    showToast('Projecte iniciat avui. Dia 1!');
  }, [showToast]);

  const togglePrep = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      prepDone: s.prepDone.includes(id) ? s.prepDone.filter((x) => x !== id) : [...s.prepDone, id],
    }));
  }, []);

  // ---------- Suplements ----------
  const toggleCreatine = useCallback(() => {
    setState((s) => {
      const dates = s.supplements?.creatineDates ?? [];
      const has = dates.includes(todayISO());
      const next = has ? dates.filter((d) => d !== todayISO()) : [...dates, todayISO()];
      showToast(has ? 'Creatina desmarcada' : 'Creatina anotada · feta avui');
      return { ...s, supplements: { ...s.supplements, creatineDates: next } };
    });
  }, [showToast]);

  /** Desa les macros per cassó de l'Anabolic Master (dades de l'etiqueta). */
  const saveAnabolicServing = useCallback(
    (kcal: number, protein: number) => {
      setState((s) => ({
        ...s,
        supplements: { ...s.supplements, anabolicServing: { kcal: Math.round(kcal), protein: Math.round(protein) } },
      }));
      showToast('Anabolic Master · dades de l’etiqueta desades');
    },
    [showToast],
  );

  // ---------- Weekly Planner ----------
  const generateWeek = useCallback(() => {
    setState((s) => {
      const weeklyPlan = generateWeeklyMenu({
        startDate: todayISO(),
        dislikes: s.dislikes,
        targetKcal: s.profile.kcalGoal,
        targetProtein: s.profile.protGoal,
      });
      return { ...s, weeklyPlan, meals: mergePlanIntoToday(s.meals, weeklyPlan) };
    });
    showToast('Menú setmanal generat · avui actualitzat');
  }, [showToast]);

  const regenerateWeekDay = useCallback(
    (dateISO: string) => {
      setState((s) => {
        if (!s.weeklyPlan) return s;
        const weeklyPlan = regenerateDayInWeek(s.weeklyPlan, dateISO, {
          dislikes: s.dislikes,
          targetKcal: s.profile.kcalGoal,
          targetProtein: s.profile.protGoal,
        });
        // Si regeneres AVUI, actualitza també els àpats pendents del dia.
        const meals = dateISO === todayISO() ? mergePlanIntoToday(s.meals, weeklyPlan) : s.meals;
        return { ...s, weeklyPlan, meals };
      });
      showToast('Dia regenerat');
    },
    [showToast],
  );

  const savePersonalIngredient = useCallback(
    (name: string, kcalPer100g: number, proteinPer100g: number) => {
      const nm = name.trim();
      // Plausibilitat per 100 g: mai desa números impossibles.
      if (
        nm.length < 2 ||
        !Number.isFinite(kcalPer100g) || kcalPer100g <= 0 || kcalPer100g > 1000 ||
        !Number.isFinite(proteinPer100g) || proteinPer100g < 0 || proteinPer100g > 100 ||
        proteinPer100g * 4 > kcalPer100g * 1.15 + 10
      ) {
        showToast('Valors no vàlids (revisa kcal i proteïna per 100 g)');
        return;
      }
      setState((s) => {
        const list = s.personalIngredients ?? [];
        const key = nm.toLowerCase();
        const idx = list.findIndex((it) => it.name.toLowerCase() === key);
        const item: PersonalIngredient = {
          id: idx >= 0 ? list[idx].id : `pig-${Date.now()}`,
          name: nm,
          kcalPer100g: Math.round(kcalPer100g),
          proteinPer100g: Math.round(proteinPer100g * 10) / 10,
        };
        const next = idx >= 0 ? list.map((it, i) => (i === idx ? item : it)) : [...list, item].slice(-40);
        return { ...s, personalIngredients: next };
      });
      showToast('Ingredient propi desat');
    },
    [showToast],
  );

  // ---------- Label Scanner: productes reals d'etiqueta confirmada ----------
  const saveProductFromLabel = useCallback(
    (p: { name: string; kcalPer100g: number; proteinPer100g: number; carbsPer100g?: number; fatPer100g?: number; servingGrams?: number }) => {
      const nm = p.name.trim();
      // Plausibilitat per 100 g: una etiqueta real mai té aquests valors.
      if (
        nm.length < 2 ||
        !Number.isFinite(p.kcalPer100g) || p.kcalPer100g <= 0 || p.kcalPer100g > 950 ||
        !Number.isFinite(p.proteinPer100g) || p.proteinPer100g < 0 || p.proteinPer100g > 100 ||
        p.proteinPer100g * 4 > p.kcalPer100g * 1.15 + 10
      ) {
        showToast('Valors no vàlids per 100 g — revisa l\'etiqueta');
        return;
      }
      setState((s) => {
        const list = s.savedProducts ?? [];
        const key = nm.toLowerCase();
        const idx = list.findIndex((it) => it.name.toLowerCase() === key);
        const now = new Date().toISOString();
        const item: SavedProduct = {
          id: idx >= 0 ? list[idx].id : `sp-${Date.now()}`,
          name: nm,
          per100g: {
            kcal: Math.round(p.kcalPer100g),
            protein: Math.round(p.proteinPer100g * 10) / 10,
            carbs: p.carbsPer100g != null ? Math.round(p.carbsPer100g * 10) / 10 : undefined,
            fat: p.fatPer100g != null ? Math.round(p.fatPer100g * 10) / 10 : undefined,
          },
          servingGrams: p.servingGrams,
          source: 'label',
          createdAt: idx >= 0 ? list[idx].createdAt : now,
          updatedAt: now,
        };
        const next = idx >= 0 ? list.map((it, i) => (i === idx ? item : it)) : [...list, item].slice(-40);
        return { ...s, savedProducts: next };
      });
      showToast('Producte desat · etiqueta revisada per tu');
    },
    [showToast],
  );

  const removeSavedProduct = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, savedProducts: (s.savedProducts ?? []).filter((p) => p.id !== id) }));
      showToast('Producte eliminat');
    },
    [showToast],
  );

  const registerSavedProduct = useCallback(
    (id: string, grams: number) => {
      const p = (state.savedProducts ?? []).find((x) => x.id === id);
      if (!p || !Number.isFinite(grams) || grams <= 0 || grams > 2000) return;
      const f = grams / 100;
      addExtra({
        name: `${p.name} (${Math.round(grams)} g)`,
        kcal: Math.round(p.per100g.kcal * f),
        protein: Math.round(p.per100g.protein * f),
        note: `Etiqueta revisada per tu · ${Math.round(grams)} g`,
      });
    },
    [state, addExtra],
  );

  const resetAll = useCallback(() => {
    writeLocalBackup(state); // desa el que hi havia: recuperable amb «Restaurar últim backup»
    localStorage.removeItem(stateKeyFor(userId));
    setState(userId ? emptyState() : freshState());
    setTab('avui');
    showToast('Projecte reiniciat · backup guardat, es pot restaurar');
  }, [showToast, state, userId]);

  /** Importa/Restaura un estat (des de fitxer o backup local). Normalitza sense
   *  esborrar dades i desa una còpia del que hi havia abans. */
  const importState = useCallback((next: AppState) => {
    writeLocalBackup(state); // backup del que hi havia abans d'importar
    const norm = normalizeState({ ...next });
    setState(norm);
    setTab('avui');
    showToast('Dades importades · guardades en aquest navegador');
  }, [showToast, state]);

  // Cloud Sync v1 — slice aïllat (Auth + estat remot per usuari). No trenca res:
  // localStorage segueix sent la font immediata; el núvol és sync + backup remot.
  const cloud = useCloud({ state, importState, isReadOnly, showToast, user });

  const value = useMemo<Ctx>(() => {
    // Punt únic de bloqueig: en mode visita, cap acció d'edició s'executa.
    function guard<A extends unknown[]>(fn: (...a: A) => void) {
      return (...a: A) => {
        if (isReadOnly) {
          showToast('Mode visita: aquesta acció està bloquejada.');
          return;
        }
        fn(...a);
      };
    }
    return {
      ...cloud,
      state, tab, setTab, toast, showToast, sheet, openSheet, closeSheet, isReadOnly,
      // navegació i visualització no es bloquegen
      markMeal: guard(markMeal),
      changeMeal: guard(changeMeal),
      partialMeal: guard(partialMeal),
      skipMeal: guard(skipMeal),
      undoMeal: guard(undoMeal),
      addExtra: guard(addExtra),
      addAdjustment: guard(addAdjustment),
      removeExtra: guard(removeExtra),
      swapMeal: guard(swapMeal),
      replaceMealWithPurchaseOption: guard(replaceMealWithPurchaseOption),
      dislikeMeal: guard(dislikeMeal),
      addRecipe: guard(addRecipe),
      regenerateDay: guard(regenerateDay),
      addShake: guard(addShake),
      markGym: guard(markGym),
      setDayMode: guard(setDayMode),
      toggleHardDay: guard(toggleHardDay),
      toggleLowAppetite: guard(toggleLowAppetite),
      submitCheckin: guard(submitCheckin),
      addWeight: guard(addWeight),
      updateProfile: guard(updateProfile),
      completeOnboarding: guard(completeOnboarding),
      setProjectStartDate: guard(setProjectStartDate),
      startToday: guard(startToday),
      togglePrep: guard(togglePrep),
      resetAll: guard(resetAll),
      importState: guard(importState),
      toggleCreatine: guard(toggleCreatine),
      saveAnabolicServing: guard(saveAnabolicServing),
      generateWeek: guard(generateWeek),
      regenerateWeekDay: guard(regenerateWeekDay),
      savePersonalIngredient: guard(savePersonalIngredient),
      saveProductFromLabel: guard(saveProductFromLabel),
      removeSavedProduct: guard(removeSavedProduct),
      registerSavedProduct: guard(registerSavedProduct),
    };
  }, [
    state, tab, toast, sheet, isReadOnly, showToast, openSheet, closeSheet, markMeal, changeMeal, partialMeal,
    skipMeal, undoMeal, addExtra, addAdjustment, removeExtra, swapMeal, replaceMealWithPurchaseOption, dislikeMeal,
    addRecipe, regenerateDay, addShake, markGym, setDayMode, toggleHardDay, toggleLowAppetite,
    submitCheckin, addWeight, updateProfile, completeOnboarding, setProjectStartDate, startToday, togglePrep, resetAll,
    importState, toggleCreatine, saveAnabolicServing, generateWeek, regenerateWeekDay, savePersonalIngredient,
    saveProductFromLabel, removeSavedProduct, registerSavedProduct, cloud,
  ]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp ha de ser dins de AppProvider');
  return ctx;
}
