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
import type { MealRecipe, ResolvedMeal } from '../nutrition/nutritionTypes';
import { DEFAULT_PROFILE } from '../data/program';
import { defaultDayRecipes, RECIPE_POOL, SHAKE_RECIPES } from '../nutrition/mealPlans';
import { resolveRecipe } from '../nutrition/mealBuilder';
import { todayISO } from '../utils/date';
import { doneCount } from '../utils/goals';
import { isStarted } from '../utils/project';

const KEY = 'project75_state_v3'; // v3: data d'inici + sense dades mock

function buildDayMeals(): ResolvedMeal[] {
  return defaultDayRecipes().map((r) => resolveRecipe(r, { id: `day-${r.slot}`, done: false }));
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
    profile: { ...DEFAULT_PROFILE },
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw) as AppState;
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
    s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    s.completedDates = s.completedDates ?? [];
    s.prepDone = s.prepDone ?? [];
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
  markMeal: (id: string) => void;
  swapMeal: (id: string, recipe: MealRecipe) => void;
  dislikeMeal: (id: string) => void;
  addRecipe: (recipe: MealRecipe) => void;
  regenerateDay: () => void;
  addShake: () => void;
  markGym: () => void;
  setDayMode: (m: AppState['dayMode']) => void;
  toggleHardDay: () => void;
  toggleLowAppetite: () => void;
  submitCheckin: (c: Omit<CheckIn, 'at'>) => void;
  addWeight: (kg?: number) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setProjectStartDate: (iso: string) => void;
  startToday: () => void;
  togglePrep: (id: string) => void;
  resetAll: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<Tab>('avui');
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ReactNode | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

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
        const meals = s.meals.map((m) => (m.id === id ? { ...m, done: true } : m));
        return bumpStreak({ ...s, meals });
      });
      showToast('Ingesta completada');
    },
    [bumpStreak, showToast],
  );

  const swapMeal = useCallback(
    (id: string, recipe: MealRecipe) => {
      setState((s) => ({
        ...s,
        meals: s.meals.map((m) => (m.id === id ? resolveRecipe(recipe, { id: m.id, done: m.done }) : m)),
      }));
      showToast('Àpat canviat');
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
        return { ...s, dislikes };
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
    (kg?: number) => {
      setState((s) => {
        const last = s.weights.length ? s.weights[s.weights.length - 1].kg : s.profile.startWeight;
        const value = kg ?? Math.round((last + 0.3) * 10) / 10;
        return { ...s, weights: [...s.weights, { d: todayISO(), kg: value }] };
      });
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

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(freshState());
    setTab('avui');
    showToast('Projecte reiniciat · dades netes');
  }, [showToast]);

  const value = useMemo<Ctx>(
    () => ({
      state, tab, setTab, toast, showToast, sheet, openSheet, closeSheet,
      markMeal, swapMeal, dislikeMeal, addRecipe, regenerateDay, addShake, markGym,
      setDayMode, toggleHardDay, toggleLowAppetite, submitCheckin, addWeight, updateProfile,
      setProjectStartDate, startToday, togglePrep, resetAll,
    }),
    [
      state, tab, toast, sheet, showToast, openSheet, closeSheet, markMeal, swapMeal, dislikeMeal,
      addRecipe, regenerateDay, addShake, markGym, setDayMode, toggleHardDay, toggleLowAppetite,
      submitCheckin, addWeight, updateProfile, setProjectStartDate, startToday, togglePrep, resetAll,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp ha de ser dins de AppProvider');
  return ctx;
}
