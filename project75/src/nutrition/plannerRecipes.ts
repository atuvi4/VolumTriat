import type { MealRecipe } from './nutritionTypes';

/* Pool de receptes del Weekly Planner — supermercat, fàcils, pensades per volum
   (~3000 kcal/dia, 150 g proteïna) amb varietat de bases i proteïnes.
   Definides per ingredients (grams); la nutrició la calcula el motor. */

const P = 'estimated_portion' as const;

export const PLANNER_POOL: MealRecipe[] = [
  /* ---------------- ESMORZARS ---------------- */
  {
    id: 'w-esm-civada', slot: 'esmorzar', name: 'Civada + llet + plàtan + cacauet', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'oats', grams: 60, portionLabel: 'gran', precision: P },
      { foodId: 'milk_whole', grams: 300, portionLabel: 'normal', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'peanut_butter', grams: 20, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-esm-torrades-ous', slot: 'esmorzar', name: 'Torrades + ous + plàtan', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-esm-iogurt-proteic', slot: 'esmorzar', slots: ['berenar'], name: 'Iogurt proteic + cereals + fruits secs', tags: ['high_protein', 'quick'],
    ingredients: [
      { foodId: 'protein_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'cereal', grams: 50, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 25, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-esm-batut-proteina', slot: 'esmorzar', slots: ['snack'], name: 'Batut de llet, plàtan, civada i proteïna', tags: ['high_protein', 'liquid_calories', 'low_appetite'],
    ingredients: [
      { foodId: 'milk_whole', grams: 350, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'oats', grams: 40, portionLabel: 'normal', precision: P },
      { foodId: 'whey', grams: 30, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-esm-entrepa-gall', slot: 'esmorzar', slots: ['berenar'], name: 'Entrepà de gall dindi i formatge', tags: ['high_protein', 'quick'],
    ingredients: [
      { foodId: 'bread', grams: 100, portionLabel: 'gran', precision: P },
      { foodId: 'turkey_breast', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'cheese', grams: 30, portionLabel: 'normal', precision: P },
    ],
  },

  /* ---------------- DINARS / SOPARS ---------------- */
  {
    id: 'w-arros-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Arròs + pollastre + oli', tags: ['high_protein', 'post_workout'],
    ingredients: [
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-pasta-tonyina', slot: 'dinar', slots: ['sopar'], name: 'Pasta + tonyina + formatge', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 120, portionLabel: 'gran', precision: P },
      { foodId: 'cheese', grams: 30, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-cuscus-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Cuscús + pollastre + olives', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'couscous_cooked', grams: 220, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'olives', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-patata-ous-tonyina', slot: 'dinar', slots: ['sopar'], name: 'Patata + ous + tonyina', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 80, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-llenties-arros-ou', slot: 'dinar', slots: ['sopar'], name: 'Llenties amb arròs i ou', tags: ['homemade', 'high_protein'],
    ingredients: [
      { foodId: 'lentils_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 150, portionLabel: 'petit', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-wrap-carn-arros', slot: 'dinar', slots: ['sopar'], name: 'Wrap de carn picada + arròs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'beef_mince_cooked', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 150, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-salmo-patata', slot: 'dinar', slots: ['sopar'], name: 'Salmó + patata', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
    ],
  },
  {
    id: 'w-pollastre-pure-pa', slot: 'dinar', slots: ['sopar'], name: 'Pollastre + puré (patata) + pa', tags: ['high_protein'],
    ingredients: [
      { foodId: 'chicken_breast', grams: 170, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'bread', grams: 40, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-pasta-carn', slot: 'sopar', slots: ['dinar'], name: 'Pasta + carn picada', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'beef_mince_cooked', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-cigrons-ous', slot: 'sopar', slots: ['dinar'], name: 'Cigrons + ous', tags: ['homemade', 'high_protein'],
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-salmo-arros', slot: 'sopar', slots: ['dinar'], name: 'Salmó + arròs', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-truita-patata-pa', slot: 'sopar', name: 'Truita de patata + pa', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'potato_cooked', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'bread', grams: 60, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-arros-tonyina', slot: 'sopar', slots: ['dinar'], name: 'Arròs + tonyina + oli', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 120, portionLabel: 'gran', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-entrepa-potent', slot: 'sopar', name: 'Entrepà potent (carn + pa)', tags: ['high_protein'],
    ingredients: [
      { foodId: 'bread', grams: 140, portionLabel: 'gran', precision: P },
      { foodId: 'beef_mince_cooked', grams: 130, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 30, portionLabel: 'normal', precision: P },
    ],
  },

  /* ---------------- BERENARS / SNACKS ---------------- */
  {
    id: 'w-ber-iogurt-platan', slot: 'berenar', slots: ['snack'], name: 'Iogurt proteic + plàtan + fruits secs', tags: ['high_protein', 'quick'],
    ingredients: [
      { foodId: 'protein_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 25, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-ber-entrepa-tonyina', slot: 'berenar', slots: ['snack'], name: 'Entrepà petit de tonyina', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'bread', grams: 60, portionLabel: 'petit', precision: P },
      { foodId: 'tuna_can', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 8, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-ber-pa-formatge-fruits', slot: 'berenar', slots: ['snack'], name: 'Pa + formatge + fruits secs', tags: ['no_cook'],
    ingredients: [
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 50, portionLabel: 'gran', precision: P },
      { foodId: 'nuts', grams: 25, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-ber-llet-cereals', slot: 'berenar', slots: ['snack'], name: 'Llet + cereals + crema de cacauet', tags: ['quick', 'liquid_calories'],
    ingredients: [
      { foodId: 'milk_whole', grams: 300, portionLabel: 'normal', precision: P },
      { foodId: 'cereal', grams: 60, portionLabel: 'gran', precision: P },
      { foodId: 'peanut_butter', grams: 20, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-ber-ous-fruita', slot: 'berenar', slots: ['snack'], name: 'Ous durs + fruita', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
    ],
  },

  /* ---------------- SNACK / RESCAT ---------------- */
  {
    id: 'w-snack-batut', slot: 'snack', slots: ['berenar'], name: 'Batut complet (llet, plàtan, civada, cacauet)', tags: ['liquid_calories', 'low_appetite', 'post_workout'],
    ingredients: [
      { foodId: 'milk_whole', grams: 350, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'oats', grams: 40, portionLabel: 'normal', precision: P },
      { foodId: 'peanut_butter', grams: 25, portionLabel: 'gran', precision: P },
    ],
  },
  {
    id: 'w-snack-batut-proteic', slot: 'snack', slots: ['berenar'], name: 'Batut de proteïna + iogurt + fruits secs', tags: ['high_protein', 'liquid_calories', 'supplement'],
    ingredients: [
      { foodId: 'whey', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'protein_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-snack-pa-cacauet', slot: 'snack', slots: ['berenar'], name: 'Pa + crema de cacauet + plàtan', tags: ['quick'],
    ingredients: [
      { foodId: 'bread', grams: 60, portionLabel: 'petit', precision: P },
      { foodId: 'peanut_butter', grams: 30, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
    ],
  },
];
