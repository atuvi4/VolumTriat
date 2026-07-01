import type { MealRecipe } from './nutritionTypes';

/* Àpats definits per INGREDIENTS (grams). La nutrició la calcula el motor.
   precision:
   - estimated_portion → ració estimada (no pesada) = cas per defecte
   - manual_estimate   → plats "fora de casa", menys controlats */

const P = 'estimated_portion' as const;
const M = 'manual_estimate' as const;

export function defaultDayRecipes(): MealRecipe[] {
  return [
    {
      id: 'r-esmorzar-base', slot: 'esmorzar', name: 'Torrades + ous + plàtan',
      tags: ['high_protein', 'homemade'],
      ingredients: [
        { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
        { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
        { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      ],
    },
    {
      id: 'r-dinar-base', slot: 'dinar', name: 'Arròs + pit de pollastre + oli',
      tags: ['high_protein', 'post_workout'],
      ingredients: [
        { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
        { foodId: 'chicken_breast', grams: 150, portionLabel: 'normal', precision: P },
        { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
      ],
    },
    {
      id: 'r-berenar-base', slot: 'berenar', name: 'Iogurt grec + civada + mel + cacauet',
      tags: ['high_protein', 'quick'],
      ingredients: [
        { foodId: 'greek_yogurt', grams: 200, portionLabel: 'normal', precision: P },
        { foodId: 'oats', grams: 40, portionLabel: 'normal', precision: P },
        { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
        { foodId: 'peanut_butter', grams: 20, portionLabel: 'normal', precision: P },
      ],
    },
    {
      id: 'r-sopar-base', slot: 'sopar', name: 'Pasta + tonyina + formatge',
      tags: ['high_protein', 'homemade'],
      ingredients: [
        { foodId: 'pasta_cooked', grams: 220, portionLabel: 'normal', precision: P },
        { foodId: 'tuna_can', grams: 100, portionLabel: 'normal', precision: P },
        { foodId: 'cheese', grams: 30, portionLabel: 'normal', precision: P },
      ],
    },
    {
      id: 'r-snack-base', slot: 'snack', name: 'Batut de plàtan + llet + civada',
      tags: ['liquid_calories', 'low_appetite'],
      ingredients: [
        { foodId: 'milk_whole', grams: 300, portionLabel: 'normal', precision: P },
        { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
        { foodId: 'oats', grams: 40, portionLabel: 'normal', precision: P },
      ],
    },
  ];
}

/** Alternatives per "Canviar" i "Canvia'm el dia". */
export const RECIPE_POOL: MealRecipe[] = [
  {
    id: 'r-pollastre-patata', slot: 'dinar', name: 'Pollastre + patata + oli', tags: ['high_protein'],
    ingredients: [
      { foodId: 'chicken_breast', grams: 180, portionLabel: 'gran', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'r-salmo-arros', slot: 'sopar', name: 'Salmó + arròs', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'r-llenties-arros', slot: 'dinar', name: 'Llenties amb arròs + ou', tags: ['homemade'],
    ingredients: [
      { foodId: 'lentils_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 150, portionLabel: 'petit', precision: P },
      { foodId: 'egg', grams: 50, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'r-ous-torrades', slot: 'esmorzar', name: 'Ous remenats + torrades', tags: ['high_protein'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'r-cigrons', slot: 'dinar', name: 'Cigrons + tonyina', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'r-iogurt-fruits', slot: 'berenar', name: 'Iogurt grec + fruits secs + mel', tags: ['quick'],
    ingredients: [
      { foodId: 'greek_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 25, portionLabel: 'normal', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
];

/** Batuts d'alta densitat (rescat, afegir batut). */
export const SHAKE_RECIPES: MealRecipe[] = [
  {
    id: 'r-batut-complet', slot: 'snack', name: 'Batut complet · llet, plàtan, civada, cacauet',
    tags: ['liquid_calories', 'low_appetite', 'post_workout'],
    ingredients: [
      { foodId: 'milk_whole', grams: 350, portionLabel: 'gran', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'oats', grams: 40, portionLabel: 'normal', precision: P },
      { foodId: 'peanut_butter', grams: 25, portionLabel: 'gran', precision: P },
    ],
  },
  {
    id: 'r-batut-proteic', slot: 'snack', name: 'Batut de proteïna + iogurt + fruits secs',
    tags: ['high_protein', 'liquid_calories', 'supplement'],
    ingredients: [
      { foodId: 'whey', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'greek_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'r-batut-xocolata', slot: 'snack', name: 'Batut de civada + llet + cacauet',
    tags: ['liquid_calories', 'low_appetite'],
    ingredients: [
      { foodId: 'milk_whole', grams: 300, portionLabel: 'normal', precision: P },
      { foodId: 'oats', grams: 50, portionLabel: 'gran', precision: P },
      { foodId: 'peanut_butter', grams: 30, portionLabel: 'gran', precision: P },
    ],
  },
];

/** Opcions sense cuinar. */
export const NOCOOK_RECIPES: MealRecipe[] = [
  {
    id: 'r-nocook-iogurt', slot: 'berenar', name: 'Iogurt grec + cereals + mel + fruits secs',
    tags: ['no_cook', 'quick'],
    ingredients: [
      { foodId: 'greek_yogurt', grams: 200, portionLabel: 'normal', precision: P },
      { foodId: 'cereal', grams: 50, portionLabel: 'normal', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'r-nocook-tonyina', slot: 'sopar', name: 'Tonyina + pa + oli', tags: ['no_cook', 'high_protein'],
    ingredients: [
      { foodId: 'tuna_can', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'r-nocook-formatge', slot: 'berenar', name: 'Pa + formatge + fruits secs', tags: ['no_cook'],
    ingredients: [
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 50, portionLabel: 'gran', precision: P },
      { foodId: 'nuts', grams: 25, portionLabel: 'normal', precision: P },
    ],
  },
];

/** "Menjo fora" — plats orientatius (precisió baixa, honest). */
export const OUTSIDE_RECIPES: MealRecipe[] = [
  {
    id: 'r-fora-pasta', slot: 'dinar', name: 'Plat de pasta amb carn (fora)', tags: ['outside'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 300, portionLabel: 'gran', precision: M },
      { foodId: 'beef_lean', grams: 120, portionLabel: 'normal', precision: M },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: M },
    ],
  },
  {
    id: 'r-fora-bowl', slot: 'dinar', name: 'Bowl de pollastre + arròs (fora)', tags: ['outside', 'high_protein'],
    ingredients: [
      { foodId: 'chicken_breast', grams: 180, portionLabel: 'gran', precision: M },
      { foodId: 'rice_cooked', grams: 300, portionLabel: 'gran', precision: M },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: M },
    ],
  },
  {
    id: 'r-fora-entrepa', slot: 'sopar', name: 'Entrepà gros de llom + patates (fora)', tags: ['outside'],
    ingredients: [
      { foodId: 'bread', grams: 160, portionLabel: 'molt gran', precision: M },
      { foodId: 'beef_lean', grams: 130, portionLabel: 'normal', precision: M },
      { foodId: 'potato_cooked', grams: 250, portionLabel: 'normal', precision: M },
    ],
  },
];
