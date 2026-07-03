import type { Confidence, MealStatus, ResolvedMeal } from './nutritionTypes';

/* =========================================================
   Política de confiança nutricional — Project75
   Principi: pot estimar i recomanar, però NO pot fingir certesa.
   Prefereix «estimació baixa / revisa etiqueta» abans que inventar dades.
   Tot pur, sense estat, sense IA de pagament.
   ========================================================= */

/** Llindar de proteïna per 100 g per considerar un producte «alt en proteïna». */
export const HIGH_PROTEIN_MIN_PER100 = 10;
/** Proteïna d'àpat a partir de la qual una confiança baixa mereix avís. */
export const PROTEIN_RELEVANT = 15;

/** Font verificada = producte d'API real o etiqueta introduïda per l'usuari. */
export function isVerifiedSource(source: string): boolean {
  return source === 'openfoodfacts' || source === 'open_food_facts' || source === 'usda' || source === 'label';
}

/** «Alta proteïna» NOMÉS si les macros ho confirmen I la dada és verificada. */
export function isHighProteinVerified(proteinPer100g: number, source: string): boolean {
  return isVerifiedSource(source) && proteinPer100g >= HIGH_PROTEIN_MIN_PER100;
}

/** Un ítem es pot presentar com a «verificat» (no com a estimació)? */
export function shouldShowAsVerified(item: { source: string; confidence: Confidence }): boolean {
  return isVerifiedSource(item.source) && item.confidence !== 'low';
}

/** Proteïna/100 g «segura»: mai per sobre del màxim esperat de la categoria; si
 *  el producte no està validat, s'usa el fallback conservador (mai inflar). */
export function safeProteinPer100g(
  candidateProtein: number,
  expected: { maxProteinPer100g?: number; conservativeFallback: { protein: number } },
  validated: boolean,
): number {
  if (!validated) return expected.conservativeFallback.protein;
  const cap = expected.maxProteinPer100g;
  return cap != null ? Math.min(candidateProtein, cap) : candidateProtein;
}

/* ---------- Nivell d'àpat ---------- */
export type MealDataKind = 'manual_label' | 'manual' | 'purchase_estimate' | 'calculated';

const isPurchase = (meal: ResolvedMeal) => !!meal.originNote && /compra ia/i.test(meal.originNote);

/** Quina mena de dada és aquest àpat (per etiquetes de font honestes). */
export function mealDataKind(meal: ResolvedMeal, status: MealStatus): MealDataKind {
  if (status === 'changed') {
    return meal.logged?.note && /etiqueta/i.test(meal.logged.note) ? 'manual_label' : 'manual';
  }
  if (isPurchase(meal)) return 'purchase_estimate';
  return 'calculated';
}

/** Etiqueta de font honesta per a un àpat, mai més segura del que és. */
export function sourceLabelForMeal(meal: ResolvedMeal, status: MealStatus): string {
  switch (mealDataKind(meal, status)) {
    case 'manual_label': return 'Etiqueta introduïda per tu';
    case 'manual': return 'Dada manual introduïda per tu · no verificada';
    case 'purchase_estimate': return 'Estimació de compra ràpida · pot variar segons producte real';
    default: return 'Càlcul per ingredients (base local)';
  }
}

/** Cal avisar de confiança baixa? (la proteïna importa i la dada és fluixa) */
export function shouldWarnLowConfidence(meal: ResolvedMeal, status: MealStatus): boolean {
  if (mealDataKind(meal, status) === 'manual_label') return false; // ja és l'etiqueta seva
  return meal.confidence === 'low';
}

/** L'usuari hauria de revisar l'etiqueta? Confiança baixa i proteïna rellevant. */
export function requiresUserCheck(meal: ResolvedMeal, status: MealStatus): boolean {
  if (mealDataKind(meal, status) === 'manual_label') return false;
  const protein = meal.logged?.protein ?? meal.nutrition.protein;
  return meal.confidence === 'low' && protein >= PROTEIN_RELEVANT;
}

/** Snapshot de compra sospitós (versió antiga). No recalcula res: només avisa.
 *  Patrons: marca comercial dins una estimació (l'engine actual no n'emet en
 *  fallback) o iogurt grec «normal» amb massa proteïna per 100 g. */
export function isSuspiciousPurchaseSnapshot(meal: ResolvedMeal): boolean {
  if (!isPurchase(meal)) return false;
  for (const ing of meal.ingredients) {
    const name = ing.name.toLowerCase();
    if (/hacendado|mercadona/.test(name)) return true; // marca en una estimació = versió antiga
    const per100 = ing.grams > 0 ? (ing.nutrition.protein / ing.grams) * 100 : 0;
    if (/grec|greek/.test(name) && !/prote/.test(name) && per100 >= 6.5) return true; // grec normal massa proteic
  }
  return false;
}
