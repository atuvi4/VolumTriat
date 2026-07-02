import type { FoodItem } from './nutritionTypes';
import { FOODS } from './foodDatabase';
import { searchFoodPro, type ProFoodItem } from './apiAdapters/foodProAdapter';

/* =========================================================
   Food Catalog — capa d'accés a aliments base.
   Fonts (per ordre de preferència futur):
     1) base local verificada (foodDatabase)  ← s'usa ARA
     2) APIs normalitzades (USDA / Open Food Facts) via /api/food/search
     3) fallback local si l'API falla
   El generador de dieta treballa amb la base local (ids coneguts pel
   Nutrition Engine). L'API s'usa per DESCOBRIR/millorar dades; aquí queda
   el punt d'entrada preparat, sense trencar res si no hi ha backend/claus.
   ========================================================= */

/** Aliments base locals (valors de referència, confiança "medium"). */
export function getLocalFoods(): FoodItem[] {
  return FOODS;
}

/** Cerca al catàleg: intenta l'API i, si falla o no hi ha res, cau a local.
 *  De moment la fem servir només com a seam preparat (el generador va per local). */
export async function searchCatalog(query: string): Promise<ProFoodItem[]> {
  const q = query.trim();
  if (!q) return [];
  const api = await searchFoodPro(q, 'all'); // buit si no hi ha backend/claus
  if (api.length > 0) return api;
  // Fallback: exposa la base local amb el mateix contracte normalitzat.
  return getLocalFoods()
    .filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 8)
    .map((f) => ({
      externalId: `local:${f.id}`,
      name: f.name,
      source: 'USDA' as const, // marca com a dada de referència; confiança real a sota
      kcalPer100g: f.kcalPer100g,
      proteinPer100g: f.proteinPer100g,
      carbsPer100g: f.carbsPer100g,
      fatPer100g: f.fatPer100g,
      confidence: f.confidence,
    }));
}

/** Ingredients base coneguts per slot (ids del Nutrition Engine).
 *  Documenta la intenció nutricional; el generador combina plantilles amb
 *  aquests grups i, en el futur, els podrà enriquir amb dades d'API. */
export const SLOT_FOOD_INTENTS = {
  esmorzar: {
    carb: ['bread', 'oats', 'cereal', 'banana'],
    protein: ['egg', 'greek_yogurt', 'milk_whole', 'whey'],
    fat: ['peanut_butter', 'nuts', 'olive_oil'],
  },
  dinar: {
    carb: ['rice_cooked', 'pasta_cooked', 'potato_cooked', 'bread'],
    protein: ['chicken_breast', 'tuna_can', 'egg', 'salmon', 'lentils_cooked', 'chickpeas_cooked', 'beef_lean'],
    fat: ['olive_oil', 'cheese', 'nuts'],
  },
  berenar: {
    carb: ['oats', 'bread', 'banana'],
    protein: ['greek_yogurt', 'milk_whole', 'whey'],
    fat: ['peanut_butter', 'nuts', 'cheese'],
  },
  snack: {
    carb: ['oats', 'banana'],
    protein: ['milk_whole', 'greek_yogurt', 'whey'],
    fat: ['peanut_butter', 'nuts'],
  },
  sopar: {
    carb: ['pasta_cooked', 'rice_cooked', 'potato_cooked', 'bread'],
    protein: ['tuna_can', 'egg', 'salmon', 'chicken_breast', 'lentils_cooked'],
    fat: ['olive_oil', 'cheese'],
  },
} as const;
