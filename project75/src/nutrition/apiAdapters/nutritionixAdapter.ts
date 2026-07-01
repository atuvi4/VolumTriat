import type { CalculatedNutrition } from '../nutritionTypes';

/* Nutritionix — entrada en llenguatge natural.
   Ex: "200 g arròs, 150 g pollastre, 15 g oli".
   Requereix APP_ID + APP_KEY → SEMPRE al servidor (/api/nutrition-parse).

   Encara NO connectat (falten claus). Deixem l'adaptador preparat:
   quan el backend respongui, es mapeja aquí. Si no, retornem null
   (l'usuari fa servir la base local mentrestant). */

export interface ParsedFoodLine {
  name: string;
  grams: number;
  nutrition: CalculatedNutrition;
  confidence: 'high' | 'medium' | 'low';
}

interface NixItem {
  food_name?: string;
  serving_weight_grams?: number;
  nf_calories?: number;
  nf_protein?: number;
  nf_total_carbohydrate?: number;
  nf_total_fat?: number;
  nf_dietary_fiber?: number;
}

function mapNix(i: NixItem): ParsedFoodLine {
  return {
    name: i.food_name ?? 'aliment',
    grams: i.serving_weight_grams ?? 0,
    nutrition: {
      kcal: i.nf_calories ?? 0,
      protein: i.nf_protein ?? 0,
      carbs: i.nf_total_carbohydrate ?? 0,
      fat: i.nf_total_fat ?? 0,
      fiber: i.nf_dietary_fiber ?? 0,
    },
    confidence: 'medium',
  };
}

export async function parseNaturalLanguage(text: string): Promise<ParsedFoodLine[] | null> {
  try {
    const res = await fetch('/api/nutrition-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text }),
    });
    if (!res.ok) throw new Error('parse_unavailable'); // falten claus o no desplegat
    const data = (await res.json()) as { foods?: NixItem[] };
    return (data.foods ?? []).map(mapNix);
  } catch {
    return null;
  }
}
