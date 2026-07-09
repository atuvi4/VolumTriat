import type { Confidence, MealSlot } from '../nutrition/nutritionTypes';
import type { DayMode, WorkoutType } from '../types';

/* =========================================================
   Project75 Brain v1 — aprenentatge LOCAL.
   Principi: la intel·ligència surt del feedback i els patrons d'ús,
   NO d'inventar macros. Cap IA de pagament, cap backend.
   Aquest dataset està pensat per, més endavant, exportar-se i
   alimentar un model local / fine-tuning. Res s'entrena ara.
   ========================================================= */

export type OutcomeAction =
  | 'done'
  | 'skipped'
  | 'changed'
  | 'partial'
  | 'extra'
  | 'adjustment_added'
  | 'adjustment_removed'
  /** Compensació: una ingesta que constava com a menjada s'ha desfet/tret.
   *  Porta les kcal/proteïna que restaven perquè l'historial no quedi inflat. */
  | 'undone'
  | 'disliked';

/** Font de la dada nutricional associada a l'outcome (mai inventada). */
export type OutcomeSource = 'recipe' | 'manual' | 'partial_estimate';

/** Un fet real registrat quan l'usuari actua sobre un àpat. */
export interface MealOutcome {
  id: string;
  date: string; // ISO local (YYYY-MM-DD)
  timestamp: string; // ISO datetime
  slot: MealSlot;
  mealName: string;
  recipeId?: string;
  action: OutcomeAction;
  /** kcal/proteïna REALS si apliquen (de recepta, manual o estimació parcial). */
  kcal?: number;
  protein?: number;
  source?: OutcomeSource;
  confidence?: Confidence;
  appetite?: 'alta' | 'norm' | 'poca';
  dayMode?: DayMode;
  training?: WorkoutType;
  reason?: string;
}

/** Feedback explícit d'agrado (per a futur: dislike/like amb motiu). */
export interface MealFeedback {
  date: string;
  slot: MealSlot;
  mealName: string;
  liked: boolean;
  note?: string;
}

/** Preferència derivada per recepta/àpat (agregat d'outcomes). */
export interface FoodPreference {
  key: string; // nom de l'àpat (o recipeId)
  slot: MealSlot;
  doneCount: number;
  skippedCount: number;
  changedCount: number;
  dislikedCount: number;
  /** Adequació apresa: positiu = funciona, negatiu = evitar. */
  score: number;
}

/** Registre de decisions del Coach (acceptar/treure ajustos). */
export interface CoachDecisionLog {
  date: string;
  timestamp: string;
  kind: 'adjustment_added' | 'adjustment_removed';
  slot?: MealSlot;
  detail?: string;
}

/** Resum d'aprenentatge setmanal (derivat, per a revisió i export). */
export interface WeeklyLearningSummary {
  weekStart: string;
  outcomes: number;
  adherencePct: number | null;
  topPreferred: string[];
  topAvoided: string[];
  difficultSlots: MealSlot[];
}

/** Perfil nutricional aprés de l'usuari (derivat, no persistit). */
export interface UserNutritionProfile {
  preferredMeals: string[];
  avoidedMeals: string[];
  difficultSlots: MealSlot[];
  lowAppetiteFrequency: number; // 0..1
  bestRescueOptions: string[];
  adherenceSummary: {
    days: number;
    done: number;
    skipped: number;
    changed: number;
    partial: number;
    doneRatio: number | null; // 0..1
  };
}
