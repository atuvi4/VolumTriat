import type { ResolvedMeal } from '../nutrition/nutritionTypes';

export type DayMode = 'normal' | 'pocaGana' | 'dificil';
export type Ritme = 'moderat' | 'agressiu';
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
  /** Data real d'inici del projecte (ISO). Abans d'això → mode preparació. */
  projectStartDate: string;
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
