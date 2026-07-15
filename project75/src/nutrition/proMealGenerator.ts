import type { MealRecipe, MealSlot } from './nutritionTypes';
import { RECIPE_POOL, SHAKE_RECIPES, NOCOOK_RECIPES, slotMatchesRecipe } from './mealPlans';
import { PLANNER_POOL } from './plannerRecipes';
import { previewNutrition } from './mealBuilder';
import { recipeScore } from '../brain/brain';
import type { MealOutcome } from '../brain/brainTypes';
import type { DayMode } from '../types';

/* =========================================================
   Nutrition Plan Generator Pro v1 — generador rule-based.
   Principi: la dieta la GENERA el sistema, no l'usuari.
   Combina PLANTILLES bones (RECIPE_POOL/SHAKE/NOCOOK) amb el target i les
   preferències, i escala les racions cap a l'objectiu. Les macros SEMPRE es
   calculen amb el Nutrition Engine (previewNutrition) — mai s'inventen.
   L'API (USDA/OFF, via foodCatalog) queda com a punt d'enriquiment futur;
   ara treballem amb ids locals que el motor sap calcular (fallback robust).
   ========================================================= */

export interface ProMealInput {
  slot: MealSlot;
  targetKcal?: number;
  targetProtein?: number;
  dayMode?: DayMode;
  appetite?: 'alta' | 'norm' | 'poca';
  constraints?: string[]; // p. ex. 'no_cook'
  dislikes?: string[];
  recentMeals?: string[]; // noms a no repetir
  outcomes?: MealOutcome[]; // Brain v1 (opcional)
  maxOptions?: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Escala les racions d'una recepta cap a un factor (manté ratios de macros). */
function scaleRecipe(r: MealRecipe, factor: number): MealRecipe {
  const f = clamp(factor, 0.6, 1.6);
  if (Math.abs(f - 1) < 0.04) return r; // gairebé igual → deixa la plantilla
  return {
    ...r,
    id: `${r.id}-pro${Math.round(f * 100)}`,
    ingredients: r.ingredients.map((ing) => ({ ...ing, grams: Math.max(1, Math.round(ing.grams * f)) })),
  };
}

function dedupById(list: MealRecipe[]): MealRecipe[] {
  const seen = new Set<string>();
  return list.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/**
 * Genera 3-6 opcions de recepta per a un slot, ajustades al target i preferències.
 * Retorna MealRecipe[] (les macros les calcula després previewNutrition/resolveRecipe).
 */
export function generateMealOptionsPro(input: ProMealInput): MealRecipe[] {
  const {
    slot, targetKcal, targetProtein, dayMode, appetite,
    constraints = [], dislikes = [], recentMeals = [], outcomes = [], maxOptions = 5,
  } = input;

  const lowApp = dayMode === 'pocaGana' || appetite === 'poca';
  const noCook = constraints.some((c) => /no.?cook|cuinar/i.test(c));
  const disliked = (name: string) => dislikes.some((d) => d && name.toLowerCase().includes(d.toLowerCase()));

  // 1) Base de plantilles del slot (inclou el pool ampli del Weekly Planner:
  //    receptes reals amb més rotació de proteïnes i hidrats) + reforços.
  let pool: MealRecipe[] = [...RECIPE_POOL, ...PLANNER_POOL].filter((r) => slotMatchesRecipe(r, slot));
  if (slot === 'snack' || slot === 'berenar' || lowApp) pool = [...pool, ...SHAKE_RECIPES];
  if (noCook) pool = [...pool, ...NOCOOK_RECIPES.filter((r) => slotMatchesRecipe(r, slot))];
  pool = dedupById(pool).filter((r) => !disliked(r.name));

  // 2) Escala cada plantilla cap al target (una variant per plantilla).
  const variants = pool.map((r) => {
    const base = previewNutrition(r);
    const factor = targetKcal && base.kcal > 0 ? targetKcal / base.kcal : 1;
    const rr = factor === 1 ? r : scaleRecipe(r, factor);
    const n = previewNutrition(rr);
    return { r: rr, kcal: n.kcal, protein: n.protein };
  });

  // 3) Filtra les que queden massa lluny del target (si n'hi ha).
  let pass = variants;
  if (targetKcal) {
    const tol = Math.max(200, targetKcal * 0.3);
    pass = variants.filter((v) => Math.abs(v.kcal - targetKcal) <= tol);
    if (pass.length === 0) pass = variants; // mai deixar l'usuari sense opcions
  }

  // 4) Puntuació: proximitat kcal + proteïna + aprenentatge + varietat + context.
  const scoreOf = (v: { r: MealRecipe; kcal: number; protein: number }) => {
    let s = 0;
    if (targetKcal) s -= Math.abs(v.kcal - targetKcal) / 100;
    s += (targetProtein ? Math.min(v.protein, targetProtein) : v.protein) / 25;
    s += recipeScore(outcomes, { name: v.r.name }) * 0.5; // Brain: el que t'ha funcionat
    if (recentMeals.some((m) => m && v.r.name.toLowerCase() === m.toLowerCase())) s -= 3; // no repetir
    if (lowApp && v.r.tags.includes('liquid_calories')) s += 2.5; // poca gana → líquid dens
    if (noCook && (v.r.tags.includes('no_cook') || v.r.tags.includes('quick'))) s += 1.5;
    return s;
  };
  pass.sort((a, b) => scoreOf(b) - scoreOf(a));

  // 5) Una opció per nom (varietat) i limita.
  const seen = new Set<string>();
  const out: MealRecipe[] = [];
  for (const v of pass) {
    if (seen.has(v.r.name)) continue;
    seen.add(v.r.name);
    out.push(v.r);
    if (out.length >= maxOptions) break;
  }
  return out;
}

/**
 * FUTUR — regenerar el menú complet del dia amb varietat real.
 * Deixat preparat: encara NO s'usa (no substituïm el menú de cop).
 */
export function generateDayPlanPro(
  targetKcal: number,
  targetProtein: number,
  preferences: { dislikes?: string[]; outcomes?: MealOutcome[] } = {},
): MealRecipe[] {
  const slots: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];
  // Repartiment simple del target per slot (aproximat; s'afinarà a futur).
  const share: Record<MealSlot, number> = { esmorzar: 0.22, dinar: 0.3, berenar: 0.13, sopar: 0.27, snack: 0.08 };
  return slots.map(
    (slot) =>
      generateMealOptionsPro({
        slot,
        targetKcal: Math.round(targetKcal * share[slot]),
        targetProtein: Math.round(targetProtein * share[slot]),
        dislikes: preferences.dislikes,
        outcomes: preferences.outcomes,
        maxOptions: 1,
      })[0],
  ).filter(Boolean) as MealRecipe[];
}
