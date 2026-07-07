import type { MealSlot, ResolvedMeal } from '../nutrition/nutritionTypes';
import type { MealOutcome } from '../brain/brainTypes';
import type { WeeklyMenu } from '../nutrition/weeklyPlanner';

/** Àpat/producte que l'usuari registra a mà i es desa com a «habitual» seu
 *  (catàleg personal que aprèn del que menja de veritat). */
export interface PersonalItem {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  slot?: MealSlot;
  count: number; // cops registrat
  lastUsedAt: string; // ISO
}

export type DayMode = 'normal' | 'pocaGana' | 'dificil';
export type Ritme = 'moderat' | 'agressiu';
/** Objectiu corporal de l'usuari — determina dèficit/manteniment/superàvit. */
export type Goal = 'cut' | 'maintain' | 'bulk';
export type WorkoutType = 'gym' | 'run' | 'bike' | 'swim' | 'rest';

export interface WeightEntry {
  d: string; // ISO date
  kg: number;
}

export interface CheckIn {
  mood: 'be' | 'reg' | 'low';
  appetite: 'alta' | 'norm' | 'poca';
  energy: 'ple' | 'mid' | 'low';
  at: string;
}

export interface Profile {
  name: string;
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  startWeight: number;
  target1: number;
  target2: number;
  kcalGoal: number;
  protGoal: number;
  ritme: Ritme;
  /** Objectiu corporal: dirigeix el càlcul d'objectius nutricionals. */
  goal: Goal;
  /** Configuració inicial (onboarding) completada. Usuari nou → false. */
  onboarded: boolean;
  /** Data real d'inici del projecte (ISO). Abans d'això → mode preparació. */
  projectStartDate: string;
}

/** Suplements (a part dels batuts de menjar): creatina com a hàbit diari i
 *  Anabolic Master amb les dades reals de l'etiqueta (introduïdes per l'usuari). */
export interface SupplementsState {
  /** Dies (ISO) en què s'ha pres creatina. */
  creatineDates: string[];
  /** Macros per cassó de l'Anabolic Master, tal com les posa l'etiqueta. */
  anabolicServing?: { kcal: number; protein: number };
}

export interface AppState {
  version: number;
  date: string;
  streak: number;
  lastComplete: string | null;
  dayMode: DayMode;
  meals: ResolvedMeal[];
  gymDone: boolean;
  checkin: CheckIn | null;
  dislikes: string[];
  weights: WeightEntry[];
  profile: Profile;
  /** Dies (ISO) marcats com a completats — per a la constància des de l'inici. */
  completedDates: string[];
  /** Ids de tasques de preparació marcades. */
  prepDone: string[];
  /** Project75 Brain v1 — historial d'accions reals per aprendre (local). */
  outcomes: MealOutcome[];
  /** Suplements (creatina + Anabolic Master), a part dels batuts de menjar. */
  supplements: SupplementsState;
  /** Weekly Nutrition Planner v1 — menú setmanal per organitzar compra i cuina.
   *  Independent del menú d'avui (state.meals): planificar no toca els registres. */
  weeklyPlan?: WeeklyMenu;
  /** Catàleg personal: àpats manuals habituals de l'usuari (aprèn del que menja). */
  personalItems?: PersonalItem[];
}

export interface Goals {
  kcal: number;
  prot: number;
  meals: number;
  label: string;
}

export interface WorkoutDay {
  label: string;
  type: WorkoutType;
  focus: string;
}

export type RecAction = 'addShake' | 'hardDay' | 'lowAppetite' | 'openNutrition' | 'addWeight';

export interface Recommendation {
  id: string;
  tone: 'accent' | 'warn' | 'info';
  title: string;
  body: string;
  why?: string;
  dataUsed?: string;
  confidence?: 'high' | 'medium' | 'low';
  action?: { label: string; kind: RecAction };
}

export type Tab = 'avui' | 'nutri' | 'gym' | 'evo' | 'coach' | 'config';
export type IconName =
  | 'home' | 'nutri' | 'train' | 'evo' | 'coach' | 'settings'
  | 'flame' | 'check' | 'swap' | 'x' | 'plus' | 'cup' | 'alert'
  | 'moon' | 'chev' | 'target' | 'activity' | 'scale' | 'calendar'
  | 'image' | 'checkCircle' | 'clock' | 'store' | 'edit' | 'info' | 'database';
