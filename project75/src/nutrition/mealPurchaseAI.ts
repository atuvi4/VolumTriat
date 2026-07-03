import type {
  CalculatedNutrition, Confidence, MealSlot, NutritionSource,
  Precision, RecipeTag, ResolvedIngredient, ResolvedMeal,
} from './nutritionTypes';
import type { MealOutcome } from '../brain/brainTypes';
import type { DayMode } from '../types';
import { worstConfidence } from './nutritionSources';
import {
  resolveProductForBlock, conservativeSnapshot,
  type ExpectedProfile, type ResolvedProduct,
} from './productResolver';
import { HIGH_PROTEIN_MIN_PER100, isVerifiedSource } from './nutritionConfidencePolicy';
import { detectThemesFromFoodIds, varietyThemePenalty, type Theme } from './dailyVariety';

/* =========================================================
   Meal Purchase AI v1 — IA de compra per àpat (LOCAL, sense OpenAI).
   Principi: l'usuari NO busca ni guarda productes. Diu «Comprar per
   aquest àpat» i el sistema PROPOSA 2-4 cistelles de supermercat que
   cobreixen l'àpat pendent, amb scoring (proximitat a l'objectiu,
   facilitat, portabilitat, poca gana, dislikes, varietat, aprenentatge).

   Les macros/unitats de cada producte les dona el Product Nutrition
   Resolver: producte d'API VALIDAT si encaixa, si no fallback conservador
   (mai inflat, sense marca falsa). Cap OpenAI, cap IA de pagament.
   ========================================================= */

export type PurchaseStore = 'mercadona' | 'generic';
export type PurchaseContext = 'at_work' | 'supermarket' | 'no_cook' | 'low_appetite';

type BlockTag = 'no_cook' | 'quick' | 'portable' | 'liquid' | 'high_protein' | 'fat_heavy' | 'fruit';
type BlockRole = 'protein' | 'energy' | 'extra';

/** Un producte comprable al supermercat (unitat real de compra). */
interface BuyBlock {
  id: string;
  role: BlockRole;
  short: string; // nom curt per títols ("Iogurt proteïnes")
  genericName: string; // etiqueta genèrica (fallback, SENSE marca)
  // (unitats, grams comestibles, grams de compra si difereixen) → etiqueta
  unitLabel: (units: number, edibleGrams: number, grossGrams?: number) => string;
  maxUnits: number;
  /** Font làctia forta (iogurt/llet/batut): compta per als guardrails de volum. */
  dairy?: boolean;
  tags: BlockTag[];
  slots: MealSlot[];
  /** Terme candidat per resoldre amb /api/food/search (opcional). */
  searchTerm?: string;
  /** Perfil esperat: validació d'API + fallback conservador + unitat realista. */
  expected: ExpectedProfile;
}

const ALL: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];
const g = (n: number) => `${Math.round(n)} g`;

/* ---------- Catàleg de compra (productes reals de súper, sense cuinar gaire) ----------
   Cada bloc porta un `expected`: com validar un candidat d'API i quines macros/
   unitat conservadores usar si no es resol. NO s'assumeixen macros optimistes. */
const CATALOG: BuyBlock[] = [
  /* --- Proteïna --- */
  {
    id: 'protein_yogurt', role: 'protein', short: 'Iogurt proteïnes', genericName: 'Iogurt proteïnes 0%',
    unitLabel: (u, gr) => `${u} iogurt${u > 1 ? 's' : ''} (${g(gr)})`, maxUnits: 3, dairy: true,
    tags: ['no_cook', 'portable', 'high_protein'], slots: ['esmorzar', 'berenar', 'snack'], searchTerm: 'protein yogurt',
    expected: {
      expectedKeywords: ['protein', 'proteina', 'proteinas', 'pro '],
      minProteinPer100g: 7, // si no arriba a 7 g/100 g, NO és un iogurt proteic
      defaultUnitGrams: 150, unitType: 'g',
      conservativeFallback: { kcal: 61, protein: 10, carbs: 4, fat: 0.5 },
      fallbackConfidence: 'low', fallbackSource: 'generic',
    },
  },
  {
    id: 'protein_shake', role: 'protein', short: 'Batut proteïnes', genericName: 'Batut de proteïnes preparat',
    unitLabel: (u, gr) => `${u} ampolla${u > 1 ? 'es' : ''} (${Math.round(gr)} ml)`, maxUnits: 2, dairy: true,
    tags: ['no_cook', 'portable', 'high_protein', 'liquid'], slots: ['esmorzar', 'berenar', 'snack'], searchTerm: 'protein shake',
    expected: {
      expectedKeywords: ['protein', 'proteina', 'proteinas', 'batido', 'shake'],
      minProteinPer100g: 5,
      defaultUnitGrams: 330, unitType: 'ml',
      conservativeFallback: { kcal: 42, protein: 8, carbs: 3.5, fat: 0.6 },
      fallbackConfidence: 'low', fallbackSource: 'generic',
    },
  },
  {
    id: 'greek_yogurt', role: 'protein', short: 'Iogurt grec', genericName: 'Iogurt grec',
    unitLabel: (u, gr) => `${u} iogurt${u > 1 ? 's' : ''} (${g(gr)})`, maxUnits: 3, dairy: true,
    tags: ['no_cook', 'portable'], slots: ['esmorzar', 'berenar', 'snack'], searchTerm: 'greek yogurt',
    expected: {
      expectedKeywords: ['greek', 'griego', 'grec'],
      forbiddenKeywords: ['protein', 'proteinas', 'proteina', 'high protein'], // grec NORMAL, no proteic
      maxProteinPer100g: 6, // un grec proteic no compta com a grec normal
      minKcalPer100g: 90, maxKcalPer100g: 180,
      defaultUnitGrams: 125, unitType: 'g', // pot individual real
      // Conservador (pot ser de fruita/ensucrat): mai assumir 9 g de proteïna.
      conservativeFallback: { kcal: 140, protein: 3.5, carbs: 13, fat: 8 },
      fallbackConfidence: 'low', fallbackSource: 'generic',
    },
  },
  {
    id: 'tuna_can', role: 'protein', short: 'Tonyina', genericName: 'Tonyina al natural (llauna)',
    unitLabel: (u, gr) => `${u} llauna${u > 1 ? 'es' : ''} escorregudes (${g(gr)})`, maxUnits: 3,
    tags: ['no_cook', 'portable', 'high_protein'], slots: ['dinar', 'sopar', 'snack'], searchTerm: 'canned tuna natural',
    expected: {
      expectedKeywords: ['tuna', 'atun', 'tonyina'],
      forbiddenKeywords: ['pate', 'paté'],
      minProteinPer100g: 18, // una tonyina/paté baix en proteïna no encaixa
      defaultUnitGrams: 80, unitType: 'g',
      conservativeFallback: { kcal: 116, protein: 26, carbs: 0, fat: 1 }, // al natural
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'eggs_boiled', role: 'protein', short: 'Ous durs', genericName: 'Ous durs',
    unitLabel: (u, gr) => `${u * 2} ous durs (${g(gr)})`, maxUnits: 2,
    tags: ['no_cook', 'portable', 'high_protein'], slots: ['esmorzar', 'dinar', 'sopar', 'snack'], searchTerm: 'boiled eggs',
    expected: {
      expectedKeywords: ['egg', 'huevo', 'ou'],
      minProteinPer100g: 10,
      defaultUnitGrams: 100, unitType: 'g',
      conservativeFallback: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'chicken_ready', role: 'protein', short: 'Pollastre cuit', genericName: 'Pit de pollastre cuit (fetes)',
    unitLabel: (u, gr) => `${u} safata (${g(gr)})`, maxUnits: 2,
    tags: ['no_cook', 'portable', 'high_protein'], slots: ['dinar', 'sopar'], searchTerm: 'cooked chicken breast',
    expected: {
      expectedKeywords: ['chicken', 'pollo', 'pollastre', 'pechuga'],
      forbiddenKeywords: ['nugget', 'empanado', 'breaded', 'rebozado'],
      minProteinPer100g: 18,
      defaultUnitGrams: 150, unitType: 'g',
      conservativeFallback: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'lentils_can', role: 'protein', short: 'Llenties', genericName: 'Llenties cuites (pot)',
    unitLabel: (u, gr) => `${u} pot (${g(gr)})`, maxUnits: 2,
    tags: ['no_cook', 'quick'], slots: ['dinar', 'sopar'], searchTerm: 'cooked lentils',
    expected: {
      expectedKeywords: ['lentil', 'lenteja', 'llenties'],
      defaultUnitGrams: 250, unitType: 'g',
      conservativeFallback: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },

  /* --- Energia / hidrats --- */
  {
    id: 'banana', role: 'energy', short: 'Plàtan', genericName: 'Plàtan',
    // El plàtan es compra amb pell (~154 g) però compta la polpa (~120 g comestibles).
    unitLabel: (u, edible, gross) =>
      gross
        ? `${u} peça${u > 1 ? 'es' : ''} (~${Math.round(gross)} g compra · ~${Math.round(edible)} g comestible)`
        : `${u} plàtan${u > 1 ? 's' : ''} (${g(edible)})`,
    maxUnits: 2,
    tags: ['no_cook', 'portable', 'fruit'], slots: ALL, searchTerm: 'banana',
    expected: {
      expectedKeywords: ['banana', 'platano', 'plàtan', 'platan'],
      defaultUnitGrams: 120, unitType: 'g', // part comestible (polpa)
      purchaseUnitGrams: 154, ediblePortionFactor: 0.78, // peça amb pell ≈ 154 g
      conservativeFallback: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'oats', role: 'energy', short: 'Civada', genericName: 'Flocs de civada',
    unitLabel: (_u, gr) => `civada ${g(gr)}`, maxUnits: 2,
    tags: ['quick'], slots: ['esmorzar', 'berenar'], searchTerm: 'oats',
    expected: {
      expectedKeywords: ['oat', 'avena', 'civada'],
      forbiddenKeywords: ['cookie', 'galleta', 'bar', 'barrita', 'chocolate'], // no cereal ensucrat
      defaultUnitGrams: 40, unitType: 'g',
      conservativeFallback: { kcal: 379, protein: 13, carbs: 67, fat: 6.5 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'milk', role: 'energy', short: 'Llet', genericName: 'Llet sencera (brick)',
    unitLabel: (_u, gr) => `${Math.round(gr)} ml`, maxUnits: 2, dairy: true,
    tags: ['no_cook', 'portable', 'liquid'], slots: ['esmorzar', 'berenar', 'snack'], searchTerm: 'whole milk',
    expected: {
      expectedKeywords: ['milk', 'leche', 'llet', 'lait'],
      forbiddenKeywords: ['chocolate', 'batido', 'shake', 'condensada', 'protein'], // llet no és batut proteic
      maxProteinPer100g: 5,
      defaultUnitGrams: 250, unitType: 'ml',
      conservativeFallback: { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'bread', role: 'energy', short: 'Pa', genericName: 'Pa / entrepà',
    unitLabel: (_u, gr) => `pa ${g(gr)}`, maxUnits: 2,
    tags: ['no_cook', 'portable'], slots: ['esmorzar', 'dinar', 'sopar', 'snack'], searchTerm: 'wholemeal bread',
    expected: {
      expectedKeywords: ['bread', 'pan', 'pa'],
      forbiddenKeywords: ['protein', 'proteico', 'proteinas'], // no assumir pa proteic
      defaultUnitGrams: 80, unitType: 'g',
      conservativeFallback: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
      fallbackConfidence: 'low', fallbackSource: 'local',
    },
  },
  {
    id: 'rice_ready', role: 'energy', short: 'Arròs', genericName: 'Arròs precuit (vas)',
    unitLabel: (u, gr) => `${u} vas (${g(gr)})`, maxUnits: 2,
    tags: ['quick'], slots: ['dinar', 'sopar'], searchTerm: 'cooked rice',
    expected: {
      expectedKeywords: ['rice', 'arroz', 'arròs'],
      defaultUnitGrams: 250, unitType: 'g',
      conservativeFallback: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },
  {
    id: 'potato_ready', role: 'energy', short: 'Patata', genericName: 'Patata cuita (safata)',
    unitLabel: (u, gr) => `${u} safata (${g(gr)})`, maxUnits: 2,
    tags: ['quick'], slots: ['dinar', 'sopar'], searchTerm: 'cooked potato',
    expected: {
      expectedKeywords: ['potato', 'patata', 'papa'],
      defaultUnitGrams: 250, unitType: 'g',
      conservativeFallback: { kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
      fallbackConfidence: 'medium', fallbackSource: 'local',
    },
  },

  /* --- Extres (greix/sabor) — mai font principal de proteïna --- */
  {
    id: 'nuts', role: 'extra', short: 'Fruits secs', genericName: 'Fruits secs (bosseta)',
    unitLabel: (_u, gr) => `fruits secs ${g(gr)}`, maxUnits: 2,
    tags: ['no_cook', 'portable', 'fat_heavy'], slots: ALL, searchTerm: 'mixed nuts',
    expected: {
      expectedKeywords: ['nuts', 'frutos secos', 'fruits secs', 'almond', 'walnut', 'nut'],
      defaultUnitGrams: 30, unitType: 'g',
      conservativeFallback: { kcal: 607, protein: 21, carbs: 22, fat: 50 },
      fallbackConfidence: 'low', fallbackSource: 'local',
    },
  },
  {
    id: 'peanut_butter', role: 'extra', short: 'Crema cacauet', genericName: 'Crema de cacauet',
    unitLabel: (_u, gr) => `crema de cacauet (${g(gr)})`, maxUnits: 1,
    tags: ['no_cook', 'fat_heavy'], slots: ['esmorzar', 'berenar', 'snack'], searchTerm: 'peanut butter',
    expected: {
      expectedKeywords: ['peanut', 'cacahuete', 'cacauet'],
      defaultUnitGrams: 20, unitType: 'g',
      conservativeFallback: { kcal: 588, protein: 25, carbs: 20, fat: 50 },
      fallbackConfidence: 'low', fallbackSource: 'local',
    },
  },
  {
    id: 'cheese', role: 'extra', short: 'Formatge', genericName: 'Formatge en llesques',
    unitLabel: (_u, gr) => `formatge (${g(gr)})`, maxUnits: 1,
    tags: ['no_cook', 'portable', 'fat_heavy'], slots: ['dinar', 'sopar', 'snack'], searchTerm: 'sliced cheese',
    expected: {
      expectedKeywords: ['cheese', 'queso', 'formatge'],
      defaultUnitGrams: 30, unitType: 'g',
      conservativeFallback: { kcal: 350, protein: 25, carbs: 2, fat: 27 },
      fallbackConfidence: 'low', fallbackSource: 'local',
    },
  },
];

/* ---------- Tipus públics ---------- */
export interface PurchaseItem {
  name: string;
  qtyLabel: string;
  /** Grams COMESTIBLES (sobre els quals es calculen les macros). */
  grams: number;
  /** Pes de COMPRA (amb pell/os) si difereix del comestible. Només informatiu. */
  purchaseGrams?: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'local' | 'openfoodfacts' | 'usda' | 'generic';
  confidence: Confidence;
}

export interface PurchaseOption {
  id: string;
  title: string;
  store: PurchaseStore;
  slot: MealSlot;
  items: PurchaseItem[];
  estimatedKcal: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  confidence: Confidence;
  sourceSummary: string;
  reason: string;
  /** Suggeriment per completar si queda una mica curt de kcal (p. ex. «+ plàtan»). */
  completionHint?: string;
  tags: string[];
  score: number;
  canRegisterAsChanged: boolean;
}

export interface PurchaseAIInput {
  meal?: ResolvedMeal;
  slot: MealSlot;
  targetKcal: number;
  targetProtein: number;
  currentDayKcal?: number;
  currentDayProtein?: number;
  targetDayKcal?: number;
  targetDayProtein?: number;
  store?: PurchaseStore;
  context?: PurchaseContext;
  dayMode?: DayMode;
  appetite?: 'alta' | 'norm' | 'poca';
  dislikes?: string[];
  recentMeals?: string[];
  /** Temes d'aliment base ja menjats avui (per no repetir: pasta, arròs, làctics…). */
  eatenThemes?: string[];
  outcomes?: MealOutcome[];
  maxOptions?: number;
}

const SLOT_NOUN: Record<MealSlot, string> = {
  esmorzar: "l'esmorzar", dinar: 'el dinar', berenar: 'el berenar', sopar: 'el sopar', snack: "l'snack",
};

/* ---------- Resolució de productes (Product Nutrition Resolver) ---------- */
type Resolved = Map<string, ResolvedProduct>;

async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
}

/** Resol tots els blocs candidats (API validada o fallback conservador). */
async function resolveBlocks(blocks: BuyBlock[], store: PurchaseStore): Promise<Resolved> {
  const out: Resolved = new Map();
  const jobs = blocks.map(async (b) => {
    out.set(b.id, await resolveProductForBlock(b, store));
  });
  await withTimeout(Promise.all(jobs), 1800, undefined as unknown as void[]);
  for (const b of blocks) if (!out.has(b.id)) out.set(b.id, conservativeSnapshot(b)); // timeout → conservador
  return out;
}

const resolvedOf = (b: BuyBlock, R: Resolved): ResolvedProduct => R.get(b.id) ?? conservativeSnapshot(b);

function makeItem(part: Part, R: Resolved): PurchaseItem {
  const { block, units, grams, purchaseGrams } = part;
  const r = resolvedOf(block, R);
  const f = grams / 100; // macros SEMPRE sobre grams comestibles
  return {
    name: r.name,
    qtyLabel: block.unitLabel(units, grams, purchaseGrams),
    grams,
    purchaseGrams,
    kcal: Math.round(r.per100.kcal * f),
    protein: Math.round(r.per100.protein * f),
    carbs: Math.round(r.per100.carbs * f),
    fat: Math.round(r.per100.fat * f),
    source: r.source,
    confidence: r.confidence,
  };
}

/* ---------- Aprenentatge (Brain): «ho acabaràs menjant?» ----------
   No només macros: el senyal més fort és què acabes menjant DE VERITAT.
   'done' = t'ho acabes; 'skipped'/'changed'/'disliked' = no. */
function brainFoodBias(outcomes: MealOutcome[], words: string[]): number {
  if (!outcomes.length) return 0;
  let s = 0;
  for (const o of outcomes) {
    const name = (o.mealName ?? '').toLowerCase();
    if (!words.some((w) => name.includes(w))) continue;
    if (o.action === 'done') s += 1.2;
    else if (o.action === 'partial') s += 0.3;
    else if (o.action === 'disliked') s -= 3;
    else if (o.action === 'skipped') s -= 1.2;
    else if (o.action === 'changed') s -= 0.8;
  }
  return Math.max(-4, Math.min(4, s));
}

/** Dificultat d'un àpat segons l'historial: proporció de saltat/canviat (0..1). */
function slotDifficulty(outcomes: MealOutcome[], slot: MealSlot): number {
  const rel = outcomes.filter(
    (o) => o.slot === slot && ['done', 'skipped', 'changed', 'partial'].includes(o.action),
  );
  if (rel.length < 3) return 0;
  const hard = rel.filter((o) => o.action === 'skipped' || o.action === 'changed').length;
  return hard / rel.length;
}

type Part = { block: BuyBlock; units: number; grams: number; purchaseGrams?: number };
interface Combo {
  parts: Part[];
  kcal: number; protein: number; carbs: number; fat: number;
}

const norm = (s: string) => s.toLowerCase();

/* ---------- Guardrails de racions (realisme) ---------- */
const UNIT_CAP: Record<string, number> = {
  milk: 1, banana: 1, oats: 1, nuts: 1, peanut_butter: 1, bread: 1, cheese: 1,
  rice_ready: 1, potato_ready: 1, lentils_can: 1,
  protein_yogurt: 2, greek_yogurt: 2, protein_shake: 2,
  tuna_can: 2, eggs_boiled: 2, chicken_ready: 2,
};
const unitCap = (b: BuyBlock) => Math.min(b.maxUnits, UNIT_CAP[b.id] ?? 2);

const isFruit = (b: BuyBlock) => b.tags.includes('fruit');
const isLiquid = (b: BuyBlock) => b.tags.includes('liquid');

/** Mètriques de volum/digestió d'una cistella (fa servir els grams RESOLTS). */
function metricsOf(c: Combo) {
  let liquidMl = 0, dairyGrams = 0, dairyCount = 0, shakeUnits = 0, solidHeavy = false;
  const ids = new Set<string>();
  for (const { block, units, grams } of c.parts) {
    ids.add(block.id);
    if (isLiquid(block)) liquidMl += grams;
    if (block.dairy) { dairyGrams += grams; dairyCount += 1; }
    if (block.id === 'protein_shake') shakeUnits += units;
    if (!isLiquid(block) && !isFruit(block) && !block.dairy) solidHeavy = true;
  }
  const isShake = liquidMl >= 250 && !solidHeavy;
  return {
    liquidMl, dairyGrams, dairyCount, shakeUnits, isShake,
    hasShake: shakeUnits > 0,
    hasMilk: ids.has('milk'), hasYogurt: ids.has('protein_yogurt') || ids.has('greek_yogurt'),
    hasPeanut: ids.has('peanut_butter'),
  };
}

/** Rebuig dur: combinacions poc realistes que mai s'han de proposar. */
function isPlausible(c: Combo): boolean {
  const m = metricsOf(c);
  const soleShake = c.parts.length === 1 && c.parts[0].block.id === 'protein_shake';
  if (m.liquidMl > 700) return false;
  if (m.hasShake && (m.hasMilk || m.hasYogurt)) return false;
  if (m.shakeUnits >= 2 && !soleShake) return false;
  if (!soleShake && m.dairyGrams > 500) return false;
  if (m.liquidMl > 500 && !m.isShake) return false;
  if (m.liquidMl > 400 && !m.isShake && m.dairyCount >= 2) return false;
  if (m.hasMilk && m.hasYogurt && m.hasPeanut) return false;
  return true;
}

/* Fillers SÒLIDS per completar kcal (mai líquids ni més làctic), per prioritat. */
const SOLID_FILLERS = ['banana', 'nuts', 'peanut_butter', 'oats', 'bread'];

const partsKcal = (parts: Part[], R: Resolved) =>
  parts.reduce((n, pt) => n + makeItem(pt, R).kcal, 0);

const mkPart = (block: BuyBlock, units: number, R: Resolved): Part => {
  const r = resolvedOf(block, R);
  return {
    block, units,
    grams: r.unitGrams * units, // comestible
    purchaseGrams: r.purchaseUnitGrams != null ? r.purchaseUnitGrams * units : undefined, // de compra
  };
};

/**
 * Ajust intel·ligent de ració: si una cistella queda curta de kcal (<90% del
 * target) però bé de proteïna, hi afegeix UN sòlid realista (plàtan, fruits
 * secs, crema, civada, pa) per entrar a rang — mai més líquid ni més làctic.
 */
export function improvePurchaseOptionPortion(
  parts: Part[], targetKcal: number, targetProtein: number, slot: MealSlot, R: Resolved,
): Part[] {
  let kcal = 0, protein = 0;
  for (const pt of parts) {
    const it = makeItem(pt, R);
    kcal += it.kcal; protein += it.protein;
  }
  if (kcal >= targetKcal * 0.9) return parts;
  if (protein < targetProtein * 0.8) return parts; // problema de proteïna: no ho tapem amb hidrats
  const present = new Set(parts.map((pt) => pt.block.id));
  const hasBase = parts.some((pt) => pt.block.dairy);
  for (const id of SOLID_FILLERS) {
    if (present.has(id)) continue;
    if (id === 'oats' && !hasBase) continue;
    const block = CATALOG.find((b) => b.id === id && b.slots.includes(slot));
    if (!block) continue;
    const add = makeItem(mkPart(block, 1, R), R).kcal;
    if (kcal + add <= targetKcal * 1.15) return [...parts, mkPart(block, 1, R)];
  }
  return parts;
}

/** Suggeriment curt de completat per la UI («+ plàtan»), o null si ja va bé. */
function completionHint(parts: Part[], targetKcal: number, slot: MealSlot, R: Resolved): string | null {
  const kcal = partsKcal(parts, R);
  if (kcal >= targetKcal * 0.9) return null;
  const present = new Set(parts.map((pt) => pt.block.id));
  const hasBase = parts.some((pt) => pt.block.dairy);
  const HINT: Record<string, string> = {
    banana: '+ plàtan', nuts: '+ 25 g fruits secs', peanut_butter: '+ crema de cacauet (15-20 g)',
    oats: '+ civada (30-40 g)', bread: '+ pa',
  };
  for (const id of SOLID_FILLERS) {
    if (present.has(id)) continue;
    if (id === 'oats' && !hasBase) continue;
    if (CATALOG.some((b) => b.id === id && b.slots.includes(slot))) return HINT[id];
  }
  return null;
}

/**
 * IA de compra per àpat. Genera 2-4 cistelles de supermercat que cobreixen
 * l'àpat pendent, ordenades per un scoring professional. Async: resol cada
 * producte (API validada o fallback conservador) i mai s'inventa macros.
 */
export async function generatePurchaseOptionsAI(input: PurchaseAIInput): Promise<PurchaseOption[]> {
  const {
    slot, targetKcal, targetProtein,
    currentDayProtein, targetDayProtein,
    store = 'mercadona', context, dayMode, appetite,
    dislikes = [], recentMeals = [], eatenThemes = [], outcomes = [], maxOptions = 4,
  } = input;
  const eatenThemeSet = new Set<Theme>(eatenThemes as Theme[]);

  const lowApp = dayMode === 'pocaGana' || appetite === 'poca' || context === 'low_appetite';
  const atWork = context === 'at_work';
  const disliked = (b: BuyBlock) =>
    dislikes.some((d) => d && (norm(b.genericName).includes(norm(d)) || norm(b.short).includes(norm(d))));

  // Objectiu de proteïna de l'àpat: el planificat de l'slot. Si vas endarrerit,
  // s'apuja MODERADAMENT (màx +15 g), mai a mitja jornada.
  let protTarget = targetProtein;
  let bigProteinDeficit = false;
  if (targetDayProtein && currentDayProtein != null) {
    const remaining = Math.max(0, targetDayProtein - currentDayProtein);
    const behind = Math.max(0, remaining - targetProtein);
    protTarget = Math.round(targetProtein + Math.min(behind * 0.25, 15));
    bigProteinDeficit = currentDayProtein >= targetDayProtein * 0.35 && remaining > targetProtein + 30;
  }

  // Blocs disponibles per aquest slot.
  const pool = CATALOG.filter((b) => b.slots.includes(slot) && !disliked(b));
  const proteins = pool.filter((b) => b.role === 'protein');
  const addons = pool.filter((b) => b.role !== 'protein');

  // Resol cada producte (Product Nutrition Resolver): API validada o conservador.
  const R = await resolveBlocks(pool, store);

  // Construcció combinatòria: àncora de proteïna (×u) + fins a 2 guarnicions.
  const combos: Combo[] = [];
  const addCombo = (parts: Part[]) => {
    let kcal = 0, protein = 0, carbs = 0, fat = 0;
    for (const pt of parts) {
      const it = makeItem(pt, R);
      kcal += it.kcal; protein += it.protein; carbs += it.carbs; fat += it.fat;
    }
    combos.push({ parts, kcal, protein, carbs, fat });
  };

  const addWithImprove = (parts: Part[]) => {
    addCombo(parts);
    const improved = improvePurchaseOptionPortion(parts, targetKcal, protTarget, slot, R);
    if (improved.length !== parts.length) addCombo(improved);
  };

  for (const p of proteins) {
    for (let pu = 1; pu <= unitCap(p); pu++) {
      const base = [mkPart(p, pu, R)];
      addWithImprove(base);
      for (let i = 0; i < addons.length; i++) {
        const a = addons[i];
        for (let au = 1; au <= unitCap(a); au++) {
          addWithImprove([...base, mkPart(a, au, R)]);
          for (let j = i + 1; j < addons.length; j++) {
            addCombo([...base, mkPart(a, au, R), mkPart(addons[j], 1, R)]);
          }
        }
      }
    }
  }

  const tol = Math.max(220, targetKcal * 0.35);
  const slotDiff = slotDifficulty(outcomes, slot);

  const scoreOf = (c: Combo): number => {
    let s = 0;
    // 1) proximitat a kcal objectiu
    s -= Math.abs(c.kcal - targetKcal) / 100;
    // 2) proteïna: premia cobrir-la; penalitza quedar-se curt I passar-se molt.
    s += Math.min(c.protein, protTarget) / 8;
    if (c.protein < protTarget * 0.8) s -= (protTarget * 0.8 - c.protein) / 8;
    if (c.protein > protTarget + 15) s -= (c.protein - (protTarget + 15)) / 6;
    if (c.protein > protTarget + 25) s -= (c.protein - (protTarget + 25)) / 4;
    if (c.protein > 55 && !bigProteinDeficit) s -= (c.protein - 55) / 2;
    // 3) facilitat: sense cuinar i portable (a la feina)
    const items = c.parts.map((pt) => pt.block);
    if (items.every((b) => b.tags.includes('no_cook'))) s += 1.4;
    else if (items.some((b) => b.tags.includes('quick'))) s += 0.4;
    if (atWork && items.every((b) => b.tags.includes('portable'))) s += 1.2;
    else if (items.some((b) => b.tags.includes('portable'))) s += 0.4;
    // 4) volum / digestió (realisme d'esmorzar a la feina)
    const m = metricsOf(c);
    const cleanShake = m.isShake && m.dairyCount <= 1;
    if (m.liquidMl > 350 && !m.isShake) s -= (m.liquidMl - 350) / 70;
    if (m.liquidMl > 500 && !cleanShake) s -= (m.liquidMl - 500) / 30;
    if (m.dairyGrams > 450) s -= (m.dairyGrams - 450) / 40;
    if (m.dairyCount >= 2 && m.dairyGrams > 350) s -= 2.5;
    if (m.hasMilk && m.hasYogurt && m.hasPeanut) s -= 3;
    // 5) poca gana → líquid/dens i menys volum
    if (lowApp) {
      if (m.isShake) s += 2;
      if (c.parts.length <= 2) s += 1;
      if (c.kcal > targetKcal * 1.1) s -= (c.kcal - targetKcal) / 120;
    }
    // 6) penalitza massa greix (cistella desequilibrada)
    const fatKcalShare = c.kcal > 0 ? (c.fat * 9) / c.kcal : 0;
    if (fatKcalShare > 0.45) s -= (fatKcalShare - 0.45) * 8;
    // 7) simplicitat: 1-3 productes ideal
    if (c.parts.length >= 4) s -= 0.6;
    // 8) «HO ACABARÀS MENJANT?» — adherència real (Brain) + facilitat d'acabar-ho.
    let eat = 0;
    for (const b of items) {
      eat += brainFoodBias(outcomes, [norm(b.short)]);
      if (recentMeals.some((rm) => rm && norm(rm).includes(norm(b.short)))) s -= 1;
    }
    s += eat * 0.9;
    if (items.length <= 2) s += 0.6;
    if (slotDiff >= 0.5) {
      if (items.length <= 2) s += 1.2;
      if (items.every((b) => b.tags.includes('portable'))) s += 0.8;
      if (c.kcal > targetKcal) s -= (c.kcal - targetKcal) / 150;
    }
    // 9) confiança: recompensa a dades sòlides i SEGURETAT — no presentar com a
    //    solució proteica fiable el que depèn d'un producte de confiança baixa.
    const conf = worstConfidence(c.parts.map((pt) => resolvedOf(pt.block, R).confidence));
    s += conf === 'high' ? 0.6 : conf === 'medium' ? 0.3 : 0;
    if (conf === 'low' && c.protein >= protTarget) s -= 1.5; // no fingir que cobreix proteïna
    // 11) varietat diària: baixa (sense eliminar) el que repeteix un aliment ja menjat avui.
    if (eatenThemeSet.size) {
      for (const pt of c.parts) {
        for (const th of detectThemesFromFoodIds([pt.block.id])) {
          if (eatenThemeSet.has(th)) s -= varietyThemePenalty(th);
        }
      }
    }
    return s;
  };

  // Realisme primer: descarta combinacions poc pràctiques (massa làctic/líquid).
  const plausible = combos.filter(isPlausible);
  const usable = plausible.length ? plausible : combos;
  let scored = usable
    .map((c) => ({ c, score: scoreOf(c) }))
    .filter(({ c }) => Math.abs(c.kcal - targetKcal) <= tol);
  if (scored.length === 0) scored = usable.map((c) => ({ c, score: scoreOf(c) }));
  scored.sort((a, b) => b.score - a.score);

  // Diversitat: evita repetir la mateixa àncora de proteïna a totes les opcions.
  const out: PurchaseOption[] = [];
  const usedAnchors = new Set<string>();
  const usedSignatures = new Set<string>();
  const pushOption = ({ c, score }: { c: Combo; score: number }) => {
    const signature = c.parts.map((pt) => `${pt.block.id}x${pt.units}`).sort().join('+');
    if (usedSignatures.has(signature)) return;
    usedSignatures.add(signature);
    out.push(buildOption(c, score, slot, store, R, lowApp, targetKcal, outcomes, slotDiff));
  };

  for (const s of scored) {
    if (out.length >= maxOptions) break;
    const anchor = s.c.parts[0].block.id;
    if (usedAnchors.has(anchor)) continue;
    usedAnchors.add(anchor);
    pushOption(s);
  }
  for (const s of scored) {
    if (out.length >= maxOptions) break;
    pushOption(s);
  }
  return out;
}

function buildOption(
  c: Combo, score: number, slot: MealSlot, store: PurchaseStore, R: Resolved,
  lowApp: boolean, targetKcal: number, outcomes: MealOutcome[], slotDiff: number,
): PurchaseOption {
  const items = c.parts.map((pt) => makeItem(pt, R));
  const kcal = items.reduce((n, i) => n + i.kcal, 0);
  const protein = items.reduce((n, i) => n + i.protein, 0);
  const carbs = items.reduce((n, i) => n + i.carbs, 0);
  const fat = items.reduce((n, i) => n + i.fat, 0);

  // Confiança HONESTA: pitjor dels productes (el resolver ja no infla res).
  const confidence = worstConfidence(items.map((i) => i.confidence));

  const vol = metricsOf(c);

  // Tags a nivell d'opció.
  const tagSet = new Set<string>();
  for (const pt of c.parts) for (const t of pt.block.tags) tagSet.add(t);
  if (lowApp) tagSet.add('low_appetite');
  if (store === 'mercadona') tagSet.add('mercadona');
  if (vol.isShake) tagSet.add('batut_dens');
  // «Alta proteïna» NOMÉS si ho confirma un producte verificat (API/etiqueta).
  const proteinVerified = items.some(
    (it) => it.grams > 0 && isVerifiedSource(it.source) && (it.protein / it.grams) * 100 >= HIGH_PROTEIN_MIN_PER100,
  );
  if (!proteinVerified) tagSet.delete('high_protein');

  const blocks = c.parts.map((pt) => pt.block);
  const brainBias = blocks.reduce((n, b) => n + brainFoodBias(outcomes, [b.short.toLowerCase()]), 0);
  const brainFavored = brainBias >= 2;
  const slotHard = slotDiff >= 0.5;
  if (brainFavored) tagSet.add('sol_funcionar');

  const title = (vol.isShake ? 'Batut dens · ' : '') + blocks.slice(0, 3).map((b) => b.short).join(' + ');

  // Raó curta: no prometem el 100% exacte, sinó cobrir aproximadament dins rang.
  const noCook = blocks.every((b) => b.tags.includes('no_cook'));
  const portable = blocks.every((b) => b.tags.includes('portable'));
  const shortKcal = kcal < targetKcal * 0.9;
  const hint = completionHint(c.parts, targetKcal, slot, R);
  let reason = `Cobreix aproximadament ${SLOT_NOUN[slot]} amb ${protein} g de proteïna.`;
  if (vol.isShake) reason += lowApp ? ' Batut dens, fàcil de baixar en dia de poca gana.' : ' Batut dens, ràpid de prendre.';
  else if (noCook && portable) reason += ' Fàcil de menjar a la feina.';
  else if (noCook) reason += ' Es menja sense cuinar.';
  if (brainFavored) reason += ' Del que sols acabar-te.';
  else if (slotHard) reason += ` El deixo simple: ${SLOT_NOUN[slot]} se't fa costa amunt sovint.`;
  reason += ' Estimació de compra ràpida.';

  // Font honesta: reflecteix si el producte s'ha resolt via API o és estimació.
  const srcs = new Set(items.map((i) => i.source));
  const sourceSummary =
    srcs.has('openfoodfacts') || srcs.has('usda')
      ? 'Producte resolt via Open Food Facts / USDA (pot variar segons botiga)'
      : srcs.has('generic')
        ? 'Estimació genèrica de compra ràpida (macros no confirmades)'
        : 'Base local Project75 · estimació de compra ràpida';

  return {
    id: `pai-${slot}-${c.parts.map((p) => p.block.id + p.units).join('-')}`,
    title,
    store,
    slot,
    items,
    estimatedKcal: kcal,
    estimatedProtein: protein,
    estimatedCarbs: carbs,
    estimatedFat: fat,
    confidence,
    sourceSummary,
    reason,
    completionHint: shortKcal ? hint ?? undefined : undefined,
    tags: [...tagSet],
    score: Math.round(score * 100) / 100,
    canRegisterAsChanged: true,
  };
}

/* =========================================================
   Substitució de proposta (NO és menjar-ho): converteix una opció de
   compra en un "snapshot" per reemplaçar la recepta de l'àpat mantenint-lo
   PENDENT. Les macros ja estan estimades pel motor; aquí només es donen
   forma perquè l'àpat les reculli i «Fet» les sumi més tard.
   ========================================================= */

export interface PurchaseMealSnapshot {
  name: string;
  nutrition: CalculatedNutrition;
  confidence: Confidence;
  precision: Precision;
  sources: NutritionSource[];
  tags: RecipeTag[];
  ingredients: ResolvedIngredient[];
  originNote: string;
}

/** Tags de recepta segurs derivats d'una opció de compra (whitelist). */
const SAFE_TAGS: RecipeTag[] = ['no_cook', 'high_protein', 'low_appetite', 'quick'];

function itemSource(s: PurchaseItem['source']): NutritionSource {
  if (s === 'openfoodfacts') return 'open_food_facts';
  if (s === 'usda') return 'usda';
  return 'manual_estimate';
}

export function purchaseOptionToSnapshot(o: PurchaseOption): PurchaseMealSnapshot {
  const ingredients: ResolvedIngredient[] = o.items.map((it, i) => ({
    foodId: `purchase:${o.id}:${i}`,
    name: `${it.name} · ${it.qtyLabel}`,
    grams: it.grams,
    purchaseGrams: it.purchaseGrams,
    precision: 'manual_estimate',
    source: itemSource(it.source),
    confidence: it.confidence,
    nutrition: { kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat, fiber: 0 },
  }));
  const sources = Array.from(new Set(ingredients.map((i) => i.source)));
  const tags = o.tags.filter((t): t is RecipeTag => (SAFE_TAGS as string[]).includes(t));
  return {
    name: o.title,
    nutrition: { kcal: o.estimatedKcal, protein: o.estimatedProtein, carbs: o.estimatedCarbs, fat: o.estimatedFat, fiber: 0 },
    confidence: o.confidence,
    precision: 'manual_estimate',
    sources: sources.length ? sources : ['manual_estimate'],
    tags,
    ingredients,
    originNote: `Compra IA · ${o.store === 'mercadona' ? 'Mercadona' : 'Supermercat'}`,
  };
}
