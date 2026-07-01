import type { FoodItem } from '../nutritionTypes';

/* Open Food Facts — API PÚBLICA (sense clau).
   Ús: cerca de productes comercials + escaneig de codi de barres.
   Estratègia: passem per la serverless /api (evita CORS i centralitza).
   Si el backend no està desplegat, retornem [] (mai dades inventades). */

interface OffRaw {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number>;
}

export function mapOffToFood(p: OffRaw): FoodItem | null {
  const n = p.nutriments ?? {};
  const kcal = n['energy-kcal_100g'];
  if (kcal == null) return null; // sense energia fiable → descartem
  return {
    id: `off:${p.code ?? p.product_name ?? Math.random().toString(36).slice(2)}`,
    name: p.product_name ?? 'Producte',
    brand: p.brands,
    servingName: p.serving_size,
    kcalPer100g: kcal,
    proteinPer100g: n['proteins_100g'] ?? 0,
    carbsPer100g: n['carbohydrates_100g'] ?? 0,
    fatPer100g: n['fat_100g'] ?? 0,
    fiberPer100g: n['fiber_100g'],
    source: 'open_food_facts',
    sourceId: p.code,
    // OFF és col·laboratiu: qualitat variable → confiança mitjana com a màxim
    confidence: 'medium',
    category: 'other',
  };
}

export async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  try {
    const res = await fetch(`/api/food-search?source=off&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('off_unavailable');
    const data = (await res.json()) as { items?: OffRaw[] };
    return (data.items ?? []).map(mapOffToFood).filter((x): x is FoodItem => x !== null);
  } catch {
    return [];
  }
}

export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`/api/barcode?code=${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error('barcode_unavailable');
    const data = (await res.json()) as { product?: OffRaw };
    return data.product ? mapOffToFood(data.product) : null;
  } catch {
    return null;
  }
}
