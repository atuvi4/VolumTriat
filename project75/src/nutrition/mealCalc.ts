/* Càlcul fiable de kcal/proteïna a partir d'ingredients (per 100 g × grams).
   Robust: mai retorna NaN ni valors negatius; arrodoneix una sola vegada. */

export interface CalcIngredient {
  kcalPer100g: number;
  proteinPer100g: number;
  grams: number;
}

const fin = (n: number): number => (Number.isFinite(n) ? n : 0);

/** Suma kcal i proteïna d'una llista d'ingredients. Sempre enters no negatius. */
export function sumIngredients(list: CalcIngredient[]): { kcal: number; protein: number } {
  let kcal = 0;
  let protein = 0;
  for (const ing of list) {
    const f = Math.max(0, fin(ing.grams)) / 100;
    kcal += Math.max(0, fin(ing.kcalPer100g)) * f;
    protein += Math.max(0, fin(ing.proteinPer100g)) * f;
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein) };
}
