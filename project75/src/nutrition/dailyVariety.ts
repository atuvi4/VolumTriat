import type { MealSlot, ResolvedMeal } from './nutritionTypes';
import { mealStatus } from '../utils/goals';

/* =========================================================
   Daily Variety Guard v1 — detecta repeticions d'aliments base dins el mateix
   dia i suggereix variar l'àpat pendent. NO canvia res automàticament: només
   detecta, avisa i reordena/penalitza alternatives. Tot local, sense IA.
   ========================================================= */

export type Theme =
  | 'pasta' | 'rice' | 'potato' | 'bread' | 'oats'
  | 'yogurt' | 'shake' | 'milk'
  | 'tuna' | 'chicken' | 'egg' | 'legumes' | 'salmon'
  | 'nuts' | 'peanut_butter';

type WarnLevel = 'strong' | 'soft' | 'none';

interface ThemeDef {
  keywords: string[]; // en text (sense accents, minúscules)
  foodIds: string[]; // ids del Nutrition Engine i blocs de compra
  warn: WarnLevel;
  label: string; // per als missatges
  suggest: string; // alternatives suggerides
}

const THEMES: Record<Theme, ThemeDef> = {
  pasta: { keywords: ['pasta', 'macarr', 'espagueti', 'tallarin', 'fideu', 'noodle', 'lasany', 'canelo'], foodIds: ['pasta_cooked'], warn: 'strong', label: 'pasta', suggest: 'arròs, patata o ous' },
  rice: { keywords: ['arros', 'rice', 'risotto', 'sushi'], foodIds: ['rice_cooked', 'rice_ready'], warn: 'soft', label: 'arròs', suggest: 'pasta, patata o llegums' },
  potato: { keywords: ['patata', 'potato'], foodIds: ['potato_cooked', 'potato_ready'], warn: 'soft', label: 'patata', suggest: 'arròs, pasta o llegums' },
  bread: { keywords: ['pa', 'pan', 'bread', 'entrepa', 'bocata', 'sandwich', 'torrada', 'tostada', 'baguet'], foodIds: ['bread'], warn: 'strong', label: 'pa', suggest: 'civada o fruita' },
  oats: { keywords: ['civada', 'oats', 'avena', 'porridge'], foodIds: ['oats'], warn: 'soft', label: 'civada', suggest: 'pa o fruita' },
  yogurt: { keywords: ['iogurt', 'yogur', 'yogurt', 'grec', 'griego', 'greek'], foodIds: ['greek_yogurt', 'protein_yogurt'], warn: 'soft', label: 'iogurt', suggest: 'ous o fruita' },
  shake: { keywords: ['batut', 'shake', 'batido', 'smoothie', 'whey'], foodIds: ['protein_shake', 'whey'], warn: 'soft', label: 'batut', suggest: 'un àpat sòlid' },
  milk: { keywords: ['llet', 'leche', 'milk'], foodIds: ['milk_whole', 'milk'], warn: 'soft', label: 'llet', suggest: 'aigua o iogurt' },
  tuna: { keywords: ['tonyina', 'atun', 'tuna'], foodIds: ['tuna_can'], warn: 'soft', label: 'tonyina', suggest: 'pollastre o ous' },
  chicken: { keywords: ['pollastre', 'pollo', 'chicken', 'pechuga'], foodIds: ['chicken_breast', 'chicken_ready'], warn: 'soft', label: 'pollastre', suggest: 'tonyina, ous o llegums' },
  egg: { keywords: ['ou', 'ous', 'huevo', 'egg', 'truita', 'tortilla'], foodIds: ['egg', 'eggs_boiled'], warn: 'soft', label: 'ous', suggest: 'tonyina o pollastre' },
  legumes: { keywords: ['llenti', 'lenteja', 'lentil', 'cigro', 'garbanzo', 'chickpea', 'mongeta', 'judia', 'llegum', 'fesol'], foodIds: ['lentils_cooked', 'chickpeas_cooked', 'lentils_can'], warn: 'soft', label: 'llegums', suggest: 'pollastre o peix' },
  salmon: { keywords: ['salmo', 'salmon'], foodIds: ['salmon'], warn: 'soft', label: 'salmó', suggest: 'pollastre o ous' },
  nuts: { keywords: ['fruits secs', 'frutos secos', 'nuts', 'ametll', 'anacard', 'avellan', 'festuc'], foodIds: ['nuts'], warn: 'none', label: 'fruits secs', suggest: 'fruita' },
  peanut_butter: { keywords: ['cacauet', 'cacahuete', 'peanut'], foodIds: ['peanut_butter'], warn: 'none', label: 'crema de cacauet', suggest: 'fruita' },
};

const THEME_LIST = Object.keys(THEMES) as Theme[];

const SLOT_NOUN: Record<MealSlot, string> = {
  esmorzar: "l'esmorzar", dinar: 'el dinar', berenar: 'el berenar', sopar: 'el sopar', snack: "l'snack",
};

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const strip = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');

function hasKeyword(text: string, kw: string): boolean {
  if (kw.length <= 3) return new RegExp(`(^|[^a-z])${kw}([^a-z]|$)`).test(text); // paraula sencera (evita 'pa' dins 'pasta')
  return text.includes(kw);
}

/** Detecta temes a partir de text lliure i/o ids d'aliment. */
export function detectThemes(input: { text?: string; foodIds?: (string | undefined)[] }): Theme[] {
  const text = strip(input.text ?? '');
  const ids = (input.foodIds ?? []).filter(Boolean) as string[];
  const out: Theme[] = [];
  for (const t of THEME_LIST) {
    const def = THEMES[t];
    const byId = ids.some((id) => def.foodIds.includes(id));
    const byText = text ? def.keywords.some((k) => hasKeyword(text, k)) : false;
    if (byId || byText) out.push(t);
  }
  return out;
}

/** Temes d'un àpat (nom + dada manual + ingredients). */
export function detectMealThemes(meal: ResolvedMeal): Theme[] {
  const text = [meal.name, meal.logged?.name, meal.logged?.note, ...meal.ingredients.map((i) => i.name)]
    .filter(Boolean)
    .join(' · ');
  return detectThemes({ text, foodIds: meal.ingredients.map((i) => i.foodId) });
}

/** Temes derivats de foodIds (per als blocs de compra). */
export function detectThemesFromFoodIds(ids: string[]): Theme[] {
  return detectThemes({ foodIds: ids });
}

const isEaten = (m: ResolvedMeal) => ['done', 'changed', 'partial'].includes(mealStatus(m));

/** Temes ja MENJATS avui (done/changed/partial), amb recompte. */
export function detectDayFoodThemes(meals: ResolvedMeal[]): Map<Theme, number> {
  const map = new Map<Theme, number>();
  for (const m of meals) {
    if (!isEaten(m)) continue;
    for (const t of detectMealThemes(m)) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return map;
}

/** Conjunt de temes ja menjats avui. */
export function eatenThemesToday(meals: ResolvedMeal[]): Set<Theme> {
  return new Set(detectDayFoodThemes(meals).keys());
}

/** Temes d'un àpat pendent que ja apareixen en un àpat menjat avui. */
export function repeatedThemesForMeal(meal: ResolvedMeal, meals: ResolvedMeal[]): Theme[] {
  const eaten = eatenThemesToday(meals.filter((m) => m.id !== meal.id));
  return detectMealThemes(meal).filter((t) => eaten.has(t));
}

/** Hi ha una repetició rellevant (warn ≠ none)? */
export function hasMeaningfulRepeat(meal: ResolvedMeal, meals: ResolvedMeal[]): boolean {
  return repeatedThemesForMeal(meal, meals).some((t) => THEMES[t].warn !== 'none');
}

/** Penalització d'un tema segons gravetat (per scoring/reordre). */
export function varietyThemePenalty(theme: Theme): number {
  const w = THEMES[theme].warn;
  return w === 'strong' ? 2 : w === 'soft' ? 1 : 0;
}

/** Puntuació de repetició d'una llista de temes respecte als ja menjats. */
export function varietyRepeatScore(themes: Theme[], eaten: Set<Theme>): number {
  return themes.reduce((n, t) => n + (eaten.has(t) ? varietyThemePenalty(t) : 0), 0);
}

export interface VarietySuggestion {
  theme: Theme;
  level: WarnLevel;
  message: string;
}

/** Suggeriment de varietat per a un àpat pendent, o null si no cal. */
export function varietySuggestionForMeal(meal: ResolvedMeal, meals: ResolvedMeal[]): VarietySuggestion | null {
  const repeats = repeatedThemesForMeal(meal, meals).filter((t) => THEMES[t].warn !== 'none');
  if (!repeats.length) return null;
  // El més greu primer (strong > soft), després per pes.
  repeats.sort((a, b) => varietyThemePenalty(b) - varietyThemePenalty(a));
  const theme = repeats[0];
  const def = THEMES[theme];
  const message = `Ja has menjat ${def.label} avui. Millor variar ${SLOT_NOUN[meal.slot]} (prova ${def.suggest}).`;
  return { theme, level: def.warn, message };
}
