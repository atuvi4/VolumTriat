import type { FoodItem } from '../nutritionTypes';

/* USDA FoodData Central — requereix API KEY (gratuïta).
   La clau va SEMPRE al servidor (serverless /api/food-search?source=usda),
   mai al frontend. Aquí només mapegem la resposta. */

interface UsdaRaw {
  fdcId?: number;
  description?: string;
  foodNutrients?: { nutrientName?: string; value?: number; unitName?: string }[];
}

function nutrient(raw: UsdaRaw, name: string): number {
  const found = raw.foodNutrients?.find((x) => x.nutrientName?.toLowerCase().includes(name));
  return found?.value ?? 0;
}

export function mapUsdaToFood(raw: UsdaRaw): FoodItem | null {
  if (!raw.description) return null;
  return {
    id: `usda:${raw.fdcId ?? raw.description}`,
    name: raw.description,
    kcalPer100g: nutrient(raw, 'energy'),
    proteinPer100g: nutrient(raw, 'protein'),
    carbsPer100g: nutrient(raw, 'carbohydrate'),
    fatPer100g: nutrient(raw, 'total lipid'),
    fiberPer100g: nutrient(raw, 'fiber'),
    source: 'usda',
    sourceId: raw.fdcId ? String(raw.fdcId) : undefined,
    confidence: 'high', // font oficial
    category: 'other',
  };
}

export async function searchUsda(query: string): Promise<FoodItem[]> {
  try {
    const res = await fetch(`/api/food-search?source=usda&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('usda_unavailable'); // p.ex. falta USDA_API_KEY al servidor
    const data = (await res.json()) as { items?: UsdaRaw[] };
    return (data.items ?? []).map(mapUsdaToFood).filter((x): x is FoodItem => x !== null);
  } catch {
    return [];
  }
}

/** Detall d'un aliment USDA ja normalitzat pel servidor (/api/food-details).
 *  Retorna null si no hi ha clau o falla → el frontend usa la base local. */
export async function getUsdaFoodDetails(fdcId: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`/api/food-details?source=usda&id=${encodeURIComponent(fdcId)}`);
    if (!res.ok) throw new Error('usda_details_unavailable');
    const data = (await res.json()) as { food?: FoodItem | null };
    return data.food ?? null;
  } catch {
    return null;
  }
}
