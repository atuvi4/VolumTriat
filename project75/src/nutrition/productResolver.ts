import type { Confidence } from './nutritionTypes';
import { searchFoodPro, type ProFoodItem } from './apiAdapters/foodProAdapter';
import { safeProteinPer100g } from './nutritionConfidencePolicy';

/* =========================================================
   Product Nutrition Resolver v1
   Objectiu: que Meal Purchase AI no assumeixi macros/unitats genèriques
   incorrectes per als productes de supermercat.

   Regla d'or:
     1) si hi ha un producte real/API que ENCAIXA amb el perfil esperat → l'usa
     2) si no → estimació conservadora del bloc (mai inflada)
     3) si no està segur → confiança baixa
     4) mai infla proteïna/kcal per fer quadrar macros
     5) mai diu una marca (p. ex. «Hacendado») si no ve d'un resultat real

   Cap OpenAI, cap IA de pagament, cap clau al client (l'API va via
   /api/food/search, que ja amaga claus al servidor).
   ========================================================= */

/** Perfil esperat d'un producte per validar candidats i tenir fallback honest. */
export interface ExpectedProfile {
  expectedCategory?: string;
  /** El nom del producte ha de contenir com a mínim una d'aquestes (multi-idioma). */
  expectedKeywords: string[];
  /** Si el nom conté alguna d'aquestes, es descarta (p. ex. «protein» per a iogurt grec normal). */
  forbiddenKeywords?: string[];
  minProteinPer100g?: number;
  maxProteinPer100g?: number;
  minKcalPer100g?: number;
  maxKcalPer100g?: number;
  /** Grams NUTRICIONALS (part comestible) quan l'API no dona serving fiable. */
  defaultUnitGrams: number;
  unitType: 'g' | 'ml';
  /** Pes de COMPRA de la peça (amb pell/os), si difereix del comestible (p. ex. plàtan 154 g). */
  purchaseUnitGrams?: number;
  /** Fracció comestible (0..1). Si hi és, la nutrició es calcula sobre la part
   *  comestible, no sobre el pes de compra. P. ex. plàtan ≈ 0.78. */
  ediblePortionFactor?: number;
  /** Macros conservadores per 100 g (mai inflades) si no hi ha producte resolt. */
  conservativeFallback: { kcal: number; protein: number; carbs: number; fat: number };
  fallbackConfidence: Confidence;
  /** 'local' = valor de referència raonable; 'generic' = estimació prudent. */
  fallbackSource: 'local' | 'generic';
}

/** Contracte mínim que ha de complir un bloc de compra per ser resolt. */
export interface ResolvableBlock {
  id: string;
  genericName: string;
  searchTerm?: string;
  expected: ExpectedProfile;
}

/** Resultat de la resolució: la font de veritat de macros/unitat/nom/confiança. */
export interface ResolvedProduct {
  per100: { kcal: number; protein: number; carbs: number; fat: number };
  /** Grams sobre els quals es calculen les macros = part COMESTIBLE. */
  unitGrams: number;
  /** Pes de COMPRA de la peça (amb pell/os), si difereix del comestible. Només display. */
  purchaseUnitGrams?: number;
  name: string;
  /** true NOMÉS si ve d'un producte real (API). En fallback és fals → nom genèric. */
  brandResolved: boolean;
  source: 'openfoodfacts' | 'usda' | 'generic' | 'local';
  confidence: Confidence;
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const strip = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
const CONF_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
const worse = (a: Confidence, b: Confidence): Confidence => (CONF_RANK[a] <= CONF_RANK[b] ? a : b);

/** Valida que un producte d'API correspon realment a la categoria esperada.
 *  No accepta res «pel nom comercial»: exigeix macros dins rang i paraules clau. */
export function validateProductCategory(p: ProFoodItem, ex: ExpectedProfile): { ok: boolean; reason?: string } {
  if (!(p.kcalPer100g > 0)) return { ok: false, reason: 'sense kcal' };
  const text = strip(`${p.name} ${p.brand ?? ''}`);
  if (ex.forbiddenKeywords?.some((k) => text.includes(strip(k)))) return { ok: false, reason: 'paraula prohibida' };
  if (ex.expectedKeywords.length && !ex.expectedKeywords.some((k) => text.includes(strip(k))))
    return { ok: false, reason: 'la categoria no coincideix' };
  if (ex.minProteinPer100g != null && p.proteinPer100g < ex.minProteinPer100g) return { ok: false, reason: 'proteïna massa baixa' };
  if (ex.maxProteinPer100g != null && p.proteinPer100g > ex.maxProteinPer100g) return { ok: false, reason: 'proteïna massa alta' };
  if (ex.minKcalPer100g != null && p.kcalPer100g < ex.minKcalPer100g) return { ok: false, reason: 'kcal massa baixes' };
  if (ex.maxKcalPer100g != null && p.kcalPer100g > ex.maxKcalPer100g) return { ok: false, reason: 'kcal massa altes' };
  return { ok: true };
}

/** Grams reals de la ració: serving de l'API si és fiable; si no, fallback del bloc. */
export function getServingGrams(p: ProFoodItem, fallbackUnitGrams: number): number {
  const s = (p as { servingGrams?: number }).servingGrams;
  if (typeof s === 'number' && isFinite(s) && s >= 20 && s <= 600) return Math.round(s);
  return fallbackUnitGrams;
}

/** Tria el millor candidat VÀLID (mai el primer sense validar). */
export function selectBestProductCandidate(
  candidates: ProFoodItem[], ex: ExpectedProfile, store: 'mercadona' | 'generic',
): ProFoodItem | null {
  const valid = candidates.filter((c) => validateProductCategory(c, ex).ok);
  if (!valid.length) return null;
  const mid = ex.minKcalPer100g != null && ex.maxKcalPer100g != null ? (ex.minKcalPer100g + ex.maxKcalPer100g) / 2 : null;
  const score = (c: ProFoodItem) => {
    let s = 0;
    if (store === 'mercadona' && /hacendado|mercadona/i.test(`${c.brand ?? ''} ${c.name}`)) s += 5;
    s += CONF_RANK[c.confidence];
    if (mid != null) s -= Math.abs(c.kcalPer100g - mid) / 50;
    return s;
  };
  return valid.slice().sort((a, b) => score(b) - score(a))[0];
}

/** Converteix un producte d'API validat en un snapshot de nutrició.
 *  Si el producte té part no comestible (ediblePortionFactor), el serving del
 *  súper es tracta com a pes de COMPRA i la nutrició es calcula sobre la part
 *  comestible estimada (mai sobre el pes amb pell/os). */
export function productToNutritionSnapshot(p: ProFoodItem, ex: ExpectedProfile): ResolvedProduct {
  const grossServing = getServingGrams(p, ex.purchaseUnitGrams ?? ex.defaultUnitGrams);
  const hasServing = typeof (p as { servingGrams?: number }).servingGrams === 'number';

  let unitGrams = grossServing;
  let purchaseUnitGrams: number | undefined;
  let confidence = worse(p.confidence, hasServing ? 'high' : 'medium');
  if (ex.ediblePortionFactor != null) {
    purchaseUnitGrams = grossServing;
    unitGrams = Math.round(grossServing * ex.ediblePortionFactor); // part comestible
    confidence = worse(confidence, 'medium'); // la part comestible és una estimació → mai high
  }
  // Proteïna segura: mai per sobre del màxim esperat de la categoria (belt & braces
  // sobre la validació) → cap producte pot inflar proteïna pel nom comercial.
  const protein = safeProteinPer100g(p.proteinPer100g, ex, true);
  return {
    per100: { kcal: p.kcalPer100g, protein, carbs: p.carbsPer100g, fat: p.fatPer100g },
    unitGrams,
    purchaseUnitGrams,
    name: p.brand ? `${p.name} · ${p.brand}` : p.name,
    brandResolved: true,
    source: p.source === 'USDA' ? 'usda' : 'openfoodfacts',
    confidence,
  };
}

/** Fallback conservador (sense marca, sense inflar) a partir del perfil del bloc. */
export function conservativeSnapshot(block: ResolvableBlock): ResolvedProduct {
  const ex = block.expected;
  return {
    per100: { ...ex.conservativeFallback },
    unitGrams: ex.defaultUnitGrams, // part comestible
    purchaseUnitGrams: ex.purchaseUnitGrams,
    name: block.genericName,
    brandResolved: false,
    source: ex.fallbackSource,
    confidence: ex.fallbackConfidence,
  };
}

/** Resol un bloc: API validada si encaixa; si no, fallback conservador.
 *  Mai llança: si l'API falla o no hi ha backend, torna el fallback. */
export async function resolveProductForBlock(
  block: ResolvableBlock,
  store: 'mercadona' | 'generic',
  deps: { search?: typeof searchFoodPro } = {},
): Promise<ResolvedProduct> {
  const fallback = conservativeSnapshot(block);
  if (!block.searchTerm) return fallback;
  const search = deps.search ?? searchFoodPro;
  let candidates: ProFoodItem[] = [];
  try {
    candidates = await search(block.searchTerm, 'all');
  } catch {
    return fallback;
  }
  const best = selectBestProductCandidate(candidates, block.expected, store);
  return best ? productToNutritionSnapshot(best, block.expected) : fallback;
}
