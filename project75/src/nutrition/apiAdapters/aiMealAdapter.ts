import type { MealSlot } from '../nutritionTypes';

/* Assistent d'idees d'àpats amb IA (estructurat).
   La IA NOMÉS proposa idees; les kcal/proteïna reals les calcula el Nutrition
   Engine. Per això aquí no hi ha cap camp de macros: es marca com a proposta
   pendent de càlcul/verificació. Si el backend no respon → llista buida. */

export interface AiMealSuggestion {
  id: string;
  name: string;
  slot: MealSlot;
  ingredients: { name: string; grams: number }[];
  reason: string;
  flags: { easy: boolean; noCook: boolean; liquid: boolean; highProtein: boolean };
  /** Sempre 'ai_suggestion': dada proposada, no verificada. */
  source: 'ai_suggestion';
  confidence: 'low';
}

export interface AiMealInput {
  slot: MealSlot;
  targetKcalApprox?: number;
  targetProteinApprox?: number;
  constraints?: string[];
  disliked?: string[];
  availableBaseFoods?: string[];
}

export interface AiMealResult {
  available: boolean;
  suggestions: AiMealSuggestion[];
}

export async function suggestMealsAI(input: AiMealInput): Promise<AiMealResult> {
  try {
    const res = await fetch('/api/ai-meal-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { available: false, suggestions: [] };
    const data = (await res.json()) as { available?: boolean; suggestions?: AiMealSuggestion[] };
    return { available: !!data.available, suggestions: data.suggestions ?? [] };
  } catch {
    // Fallback segur: l'usuari continua amb les alternatives de la base local.
    return { available: false, suggestions: [] };
  }
}
