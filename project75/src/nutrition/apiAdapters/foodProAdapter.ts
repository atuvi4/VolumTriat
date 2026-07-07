/* Backend Nutrition Pro v1 — adapter frontend.
   Crida els endpoints normalitzats /api/food/*. Cap clau al client.
   Si el backend/APIs fallen → resultat buit (l'app segueix amb base local). */

export interface ProFoodItem {
  externalId: string;
  name: string;
  brand?: string;
  source: 'USDA' | 'OpenFoodFacts';
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  confidence: 'high' | 'medium' | 'low';
}

export type FoodSource = 'usda' | 'off' | 'all';

/** Cerca d'aliments (USDA genèrics + Open Food Facts comercials).
 *  `store` (opcional) filtra Open Food Facts per supermercat (p. ex. 'mercadona'). */
export async function searchFoodPro(query: string, source: FoodSource = 'all', store?: string): Promise<ProFoodItem[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const storeParam = store ? `&store=${encodeURIComponent(store)}` : '';
    const res = await fetch(`/api/food/search?source=${source}&query=${encodeURIComponent(q)}${storeParam}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: ProFoodItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

/** Producte per codi de barres (Open Food Facts). */
export async function lookupBarcodePro(barcode: string): Promise<ProFoodItem | null> {
  const c = barcode.trim();
  if (!c) return null;
  try {
    const res = await fetch(`/api/food/barcode?barcode=${encodeURIComponent(c)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: ProFoodItem | null };
    return data.item ?? null;
  } catch {
    return null;
  }
}
