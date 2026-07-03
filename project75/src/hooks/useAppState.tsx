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
import type { AppState, CheckIn, Profile, Tab } from '../types';
import type { AdjustContext, ManualLog, MealRecipe, MealSlot, ResolvedMeal } from '../nutrition/nutritionTypes';
import type { PurchaseMealSnapshot } from '../nutrition/mealPurchaseAI';
import { DEFAULT_PROFILE } from '../data/program';
import { defaultDayRecipes, RECIPE_POOL, SHAKE_RECIPES } from '../nutrition/mealPlans';
import { resolveRecipe } from '../nutrition/mealBuilder';
import { todayISO } from '../utils/date';
import { doneCount } from '../utils/goals';
import { isStarted } from '../utils/project';
import { detectReadOnly } from '../utils/readOnly';
import { todayWorkout } from '../data/week';
import { appendOutcome } from '../brain/brain';
import type { MealOutcome, OutcomeAction, OutcomeSource } from '../brain/brainTypes';
import { STATE_KEY } from '../utils/storageKeys';
import { writeLocalBackup, writePreviousBackup } from '../utils/dataSafety';

const KEY = STATE_KEY; // v3: data d'inici + sense dades mock

// AMIX Anabolic Masster — presa de 50 g amb aigua (etiqueta: 366 kcal / 45 g prot per 100 g).
const DEFAULT_ANABOLIC = { kcal: 183, protein: 23 };

function buildDayMeals(): ResolvedMeal[] {
  return defaultDayRecipes().map((r) => resolveRecipe(r, { id: `day-${r.slot}`, done: false }));
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
    training: todayWorkout().type,
    reason: o.reason,
  };
  return { ...s, outcomes: appendOutcome(s.outcomes ?? [], outcome) };
}

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
    supplements: { creatineDates: [], anabolicServing: { ...DEFAULT_ANABOLIC } },
    profile: { ...DEFAULT_PROFILE },
  };
}

const DAY_SLOTS: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];

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
  return s;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw) as AppState;
    // Data Safety: desa una còpia crua ABANS de migrar (xarxa de seguretat si
    // una migració/deploy trenca l'estat). No escriure en mode visita.
    if (!detectReadOnly()) writePreviousBackup(s);
    if (s.date !== todayISO()) {
      s.date = todayISO();
      s.meals = buildDayMeals();
      s.gymDone = false;
      s.checkin = null;
      s.dayMode = 'normal';
    }
    if (!Array.isArray(s.meals) || s.meals.some((m) => !m || !m.nutrition)) {
      s.meals = buildDayMeals();
    }
    s.meals = repairMealSlots(s.meals); // corregeix slots antics (sopar marcat com dinar, etc.)
    s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    s.completedDates = s.completedDates ?? [];
    s.prepDone = s.prepDone ?? [];
    s.outcomes = s.outcomes ?? []; // Brain v1: acumula entre dies (no es reinicia)
    s.supplements = s.supplements ?? { creatineDates: [] };
    s.supplements.creatineDates = s.supplements.creatineDates ?? [];
    s.supplements.anabolicServing = s.supplements.anabolicServing ?? { ...DEFAULT_ANABOLIC };
    // no barrejar mock: elimina pesos anteriors a la data d'inici
    s.weights = (s.weights ?? []).filter((w) => w.d >= s.profile.projectStartDate);
    return s;
  } catch {
    return freshState();
  }
}

interface Ctx {
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
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>('avui');
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ReactNode | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [isReadOnly] = useState(detectReadOnly);

  useEffect(() => {
    // En mode visita no escrivim res: no toquem les dades del dispositiu.
    if (isReadOnly) return;
    localStorage.setItem(KEY, JSON.stringify(state));
    writeLocalBackup(state); // còpia «última» a cada desada (Data Safety)
  }, [state, isReadOnly]);

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
      setState((s) => {
        const meal = s.meals.find((m) => m.id === id);
        let next = bumpStreak({
          ...s,
          meals: s.meals.map((m) =>
            m.id === id
              ? { ...m, done: false, status: 'changed' as const, logged: { ...data }, partialPct: undefined }
              : m,
          ),
        });
        if (meal)
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId, action: 'changed',
            kcal: data.kcal, protein: data.protein, source: 'manual', confidence: 'low',
          });
        return next;
      });
      showToast('Àpat canviat · dada manual');
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
      setState((s) => {
        const m = s.meals.find((x) => x.id === id);
        if (m?.isExtra) return { ...s, meals: s.meals.filter((x) => x.id !== id) };
        return {
          ...s,
          meals: s.meals.map((x) =>
            x.id === id
              ? { ...x, done: false, status: 'pending' as const, logged: undefined, partialPct: undefined }
              : x,
          ),
        };
      });
      showToast('Estat esborrat');
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
        tags: [],
        nutrition: { kcal: data.kcal, protein: data.protein, carbs: 0, fat: 0, fiber: 0 },
        precision: 'manual_estimate',
        confidence: 'low',
        sources: ['manual_estimate'],
        ingredients: [],
      };
      setState((s) =>
        withOutcome(bumpStreak({ ...s, meals: [...s.meals, extra] }), {
          slot: 'snack', mealName: extra.name, action: 'extra',
          kcal: data.kcal, protein: data.protein, source: 'manual', confidence: 'low',
        }),
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
        let next: AppState = { ...s, meals: s.meals.filter((m) => m.id !== id) };
        if (meal?.isExtra && meal.extraOrigin === 'adjustment')
          next = withOutcome(next, {
            slot: meal.slot, mealName: meal.name, recipeId: meal.recipeId,
            action: 'adjustment_removed', reason: meal.relatedMealStatus,
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
    setState((s) => ({ ...s, gymDone: true }));
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

  const resetAll = useCallback(() => {
    writeLocalBackup(state); // desa el que hi havia: recuperable amb «Restaurar últim backup»
    localStorage.removeItem(KEY);
    setState(freshState());
    setTab('avui');
    showToast('Projecte reiniciat · backup guardat, es pot restaurar');
  }, [showToast, state]);

  /** Importa/Restaura un estat (des de fitxer o backup local). Normalitza sense
   *  esborrar dades i desa una còpia del que hi havia abans. */
  const importState = useCallback((next: AppState) => {
    writeLocalBackup(state); // backup del que hi havia abans d'importar
    const norm = normalizeState({ ...next });
    setState(norm);
    setTab('avui');
    showToast('Dades importades · guardades en aquest navegador');
  }, [showToast, state]);

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
      setProjectStartDate: guard(setProjectStartDate),
      startToday: guard(startToday),
      togglePrep: guard(togglePrep),
      resetAll: guard(resetAll),
      importState: guard(importState),
      toggleCreatine: guard(toggleCreatine),
      saveAnabolicServing: guard(saveAnabolicServing),
    };
  }, [
    state, tab, toast, sheet, isReadOnly, showToast, openSheet, closeSheet, markMeal, changeMeal, partialMeal,
    skipMeal, undoMeal, addExtra, addAdjustment, removeExtra, swapMeal, replaceMealWithPurchaseOption, dislikeMeal,
    addRecipe, regenerateDay, addShake, markGym, setDayMode, toggleHardDay, toggleLowAppetite,
    submitCheckin, addWeight, updateProfile, setProjectStartDate, startToday, togglePrep, resetAll, importState,
    toggleCreatine, saveAnabolicServing,
  ]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp ha de ser dins de AppProvider');
  return ctx;
}
