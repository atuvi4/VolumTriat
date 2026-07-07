import type { WeeklyMenu } from './weeklyPlanner';
import { PLANNER_BY_ID } from './weeklyPlanner';
import { getFood } from './foodDatabase';

/* Preparació setmanal, llista de compra i batch cooking a partir del menú.
   Quantitats aproximades (V1): sumem grams de les receptes i els arrodonim. */

export interface ShopItem {
  foodId: string;
  name: string;
  grams: number;
  approx: string;
}
export interface ShopGroup {
  key: string;
  label: string;
  items: ShopItem[];
}

const GROUP_LABEL: Record<string, string> = {
  proteines: 'Proteïnes',
  hidrats: 'Hidrats',
  greixos: 'Greixos / calories fàcils',
  fruita: 'Fruita / verdura',
  lactics: 'Làctics',
  extres: 'Extres / rescat',
};
const GROUP_ORDER = ['proteines', 'hidrats', 'greixos', 'fruita', 'lactics', 'extres'];

function groupForCategory(cat: string | undefined): string {
  switch (cat) {
    case 'protein':
    case 'legume':
      return 'proteines';
    case 'carb':
      return 'hidrats';
    case 'fat':
      return 'greixos';
    case 'fruit':
      return 'fruita';
    case 'dairy':
      return 'lactics';
    default:
      return 'extres'; // sweetener, supplement, other
  }
}

function approxQty(foodId: string, grams: number): string {
  if (foodId === 'egg') return `≈ ${Math.max(1, Math.round(grams / 50))} ous`;
  if (foodId === 'milk_whole') return `≈ ${(grams / 1000).toFixed(1)} L`;
  if (grams >= 1000) return `≈ ${(grams / 1000).toFixed(1)} kg`;
  return `≈ ${Math.max(50, Math.round(grams / 50) * 50)} g`;
}

/** Suma els grams de cada aliment de tot el menú i els agrupa per categoria. */
export function shoppingListFromWeeklyMenu(week: WeeklyMenu): ShopGroup[] {
  const grams = new Map<string, number>();
  for (const day of week.days) {
    for (const m of day.meals) {
      const r = PLANNER_BY_ID[m.recipeId];
      if (!r) continue;
      for (const ing of r.ingredients) {
        grams.set(ing.foodId, (grams.get(ing.foodId) ?? 0) + ing.grams);
      }
    }
  }
  const groups = new Map<string, ShopItem[]>();
  for (const [foodId, g] of grams) {
    const food = getFood(foodId);
    if (!food) continue;
    const key = groupForCategory(food.category);
    const item: ShopItem = { foodId, name: food.name, grams: Math.round(g), approx: approxQty(foodId, g) };
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  return GROUP_ORDER.filter((k) => groups.has(k)).map((k) => ({
    key: k,
    label: GROUP_LABEL[k],
    items: (groups.get(k) ?? []).sort((a, b) => b.grams - a.grams),
  }));
}

function presentFoodIds(week: WeeklyMenu): Set<string> {
  const ids = new Set<string>();
  for (const day of week.days) {
    for (const m of day.meals) {
      const r = PLANNER_BY_ID[m.recipeId];
      if (r) for (const ing of r.ingredients) ids.add(ing.foodId);
    }
  }
  return ids;
}

/** Suggeriments de preparació setmanal (batch), condicionats al que hi ha al menú. */
export function weeklyPrepSuggestions(week: WeeklyMenu): string[] {
  const ids = presentFoodIds(week);
  const out: string[] = [];
  const carbs: string[] = [];
  if (ids.has('rice_cooked')) carbs.push('arròs');
  if (ids.has('pasta_cooked')) carbs.push('pasta');
  if (ids.has('couscous_cooked')) carbs.push('cuscús');
  if (ids.has('potato_cooked')) carbs.push('patata');
  if (carbs.length) out.push(`Cuina ${carbs.join(', ')} per a 2-3 dies i guarda'ls a la nevera.`);

  const prots: string[] = [];
  if (ids.has('chicken_breast')) prots.push('pollastre');
  if (ids.has('turkey_breast')) prots.push('gall dindi');
  if (ids.has('beef_mince_cooked')) prots.push('carn picada');
  if (prots.length) out.push(`Deixa ${prots.join(' i ')} cuinat i porcionat per no improvisar.`);

  if (ids.has('egg')) out.push('Fes una tanda d’ous durs (aguanten dies) per esmorzars i berenars ràpids.');
  if (ids.has('protein_yogurt') || ids.has('greek_yogurt')) out.push('Tingues iogurts (proteic i grec) a mà per pujar proteïna sense cuinar.');
  if (ids.has('nuts') || ids.has('peanut_butter')) out.push('Fruits secs i crema de cacauet: calories denses fàcils quan costa menjar.');
  if (ids.has('bread')) out.push('Pa a punt (pots congelar): base ràpida d’entrepans potents.');
  out.push('Prepara 1-2 batuts de rescat per als dies de poca gana o quan vagis just de temps.');
  return out;
}

/** Notes curtes de batch cooking. */
export function batchCookingNotes(week: WeeklyMenu): string[] {
  const ids = presentFoodIds(week);
  const notes: string[] = [
    'Cuina en tandes 2-3 cops per setmana; no cal cuinar cada dia.',
    'Reaprofita restes amb criteri: canvia guarnició o proteïna per no repetir plat idèntic.',
  ];
  if (ids.has('salmon')) notes.push('El peix (salmó) millor fresc del dia o congelat; cuina’l a prop de menjar-lo.');
  return notes;
}
