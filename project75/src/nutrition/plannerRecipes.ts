import type { MealRecipe } from './nutritionTypes';

/* Pool de receptes del Weekly Planner — supermercat, fàcils, pensades per volum
   (~3000 kcal/dia, 150 g proteïna) amb varietat de bases i proteïnes.
   Els plats principals (dinar/sopar) porten verdura: plat equilibrat de veritat.
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

  {
    id: 'w-esm-crema-arros', slot: 'esmorzar', slots: ['snack'], name: "Crema d'arròs + proteïna + plàtan", tags: ['high_protein', 'quick', 'post_workout'],
    ingredients: [
      { foodId: 'rice_cream', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'whey', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'honey', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-esm-pancakes', slot: 'esmorzar', name: 'Pancakes de civada i plàtan', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'oats', grams: 60, portionLabel: 'gran', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'banana', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'whey', grams: 20, portionLabel: 'petit', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-esm-entrepa-pernil', slot: 'esmorzar', slots: ['berenar'], name: 'Entrepà de pernil serrà amb tomàquet', tags: ['high_protein', 'quick', 'no_cook'],
    ingredients: [
      { foodId: 'bread', grams: 100, portionLabel: 'gran', precision: P },
      { foodId: 'ham_cured', grams: 50, portionLabel: 'normal', precision: P },
      { foodId: 'tomato', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 8, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-esm-ous-remenats', slot: 'esmorzar', name: 'Ous remenats + torrada integral + alvocat', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'bread_whole', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'avocado', grams: 70, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-esm-cottage-fruita', slot: 'esmorzar', slots: ['berenar'], name: 'Bol de formatge fresc, maduixes i mel', tags: ['high_protein', 'quick', 'no_cook'],
    ingredients: [
      { foodId: 'cottage_cheese', grams: 200, portionLabel: 'gran', precision: P },
      { foodId: 'strawberries', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-esm-truita-formatge', slot: 'esmorzar', name: 'Truita de formatge + torrades', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'cheese', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 8, portionLabel: 'petit', precision: P },
    ],
  },

  /* ---------------- DINARS / SOPARS (plat equilibrat amb verdura) ---------------- */
  {
    id: 'w-arros-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Arròs + pollastre + verdura', tags: ['high_protein', 'post_workout'],
    ingredients: [
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-pasta-tonyina', slot: 'dinar', slots: ['sopar'], name: 'Pasta + tonyina + verdura', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 120, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-cuscus-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Cuscús + pollastre + verdura i olives', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'couscous_cooked', grams: 220, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olives', grams: 30, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-patata-ous-tonyina', slot: 'dinar', slots: ['sopar'], name: 'Patata + ous + tonyina + verdura', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 120, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-llenties-arros-ou', slot: 'dinar', slots: ['sopar'], name: 'Llenties amb arròs, verdura i ou', tags: ['homemade', 'high_protein'],
    ingredients: [
      { foodId: 'lentils_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 150, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 120, portionLabel: 'petit', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-salmo-patata', slot: 'dinar', slots: ['sopar'], name: 'Salmó + patata + verdura', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-pollastre-pure', slot: 'dinar', slots: ['sopar'], name: 'Pollastre + puré de patata + verdura', tags: ['high_protein'],
    ingredients: [
      { foodId: 'chicken_breast', grams: 170, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-pasta-carn', slot: 'sopar', slots: ['dinar'], name: 'Pasta bolonyesa (carn picada + verdura)', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'beef_mince_cooked', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-cigrons-verdura-ou', slot: 'sopar', slots: ['dinar'], name: 'Cigrons amb verdura i ou', tags: ['homemade', 'high_protein'],
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-salmo-arros', slot: 'sopar', slots: ['dinar'], name: 'Salmó + arròs + verdura', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-truita-patata', slot: 'sopar', name: 'Truita de patata + amanida', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'egg', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'potato_cooked', grams: 220, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-arros-tonyina', slot: 'sopar', slots: ['dinar'], name: 'Arròs amb tonyina i verdura', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 120, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-gall-patata', slot: 'dinar', slots: ['sopar'], name: 'Gall dindi + patata + verdura', tags: ['high_protein'],
    ingredients: [
      { foodId: 'turkey_breast', grams: 170, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },

  /* ----- Receptes reals (cuina de veritat, mateixa base de compra) ----- */
  {
    id: 'w-pollastre-curry', slot: 'dinar', slots: ['sopar'], name: 'Pollastre al curry amb arròs', tags: ['high_protein', 'homemade', 'post_workout'],
    ingredients: [
      { foodId: 'chicken_breast', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 120, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-arros-tres-delicies', slot: 'dinar', slots: ['sopar'], name: 'Arròs tres delícies (gambes, pernil i ou)', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'rice_cooked', grams: 280, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'ham_cooked', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'prawns', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 100, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-burrito-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Burrito de pollastre i arròs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'tortilla_wrap', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 140, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 100, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-pasta-pesto-pollastre', slot: 'dinar', slots: ['sopar'], name: 'Pasta al pesto amb pollastre', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'pasta_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 140, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 10, portionLabel: 'petit', precision: P },
      { foodId: 'cheese', grams: 15, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-chili-arros', slot: 'dinar', slots: ['sopar'], name: 'Chili de carn picada amb mongetes i arròs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'beef_mince_cooked', grams: 140, portionLabel: 'normal', precision: P },
      { foodId: 'white_beans', grams: 150, portionLabel: 'petit', precision: P },
      { foodId: 'rice_cooked', grams: 180, portionLabel: 'petit', precision: P },
      { foodId: 'tomato', grams: 100, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 80, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-cuscus-verdures-cigrons', slot: 'dinar', slots: ['sopar'], name: 'Cuscús de verdures amb cigrons i ou', tags: ['homemade', 'high_protein'],
    ingredients: [
      { foodId: 'couscous_cooked', grams: 220, portionLabel: 'normal', precision: P },
      { foodId: 'chickpeas_cooked', grams: 200, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 50, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-salmo-moniato', slot: 'dinar', slots: ['sopar'], name: 'Salmó + moniato + bròquil', tags: ['high_protein'],
    ingredients: [
      { foodId: 'salmon', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'sweet_potato', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'broccoli', grams: 150, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-hamburguesa-casolana', slot: 'dinar', slots: ['sopar'], name: 'Hamburguesa casolana completa', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'burger_beef', grams: 150, portionLabel: 'gran', precision: P },
      { foodId: 'burger_bun', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'cheese_slice', grams: 20, portionLabel: 'petit', precision: P },
      { foodId: 'lettuce', grams: 30, portionLabel: 'petit', precision: P },
      { foodId: 'tomato', grams: 50, portionLabel: 'petit', precision: P },
      { foodId: 'potato_cooked', grams: 200, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-llenties-estofades', slot: 'dinar', slots: ['sopar'], name: 'Llenties estofades amb patata i verdures', tags: ['homemade'],
    ingredients: [
      { foodId: 'lentils_cooked', grams: 300, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 150, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-amanida-mediterrania', slot: 'sopar', slots: ['dinar'], name: 'Amanida mediterrània completa (tonyina i ou)', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'lettuce', grams: 60, portionLabel: 'gran', precision: P },
      { foodId: 'tomato', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'tuna_can', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'olives', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'corn', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
      { foodId: 'bread', grams: 40, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-wok-vedella', slot: 'dinar', slots: ['sopar'], name: 'Wok de vedella amb verdures i arròs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'beef_steak', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 220, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-fajitas-pollastre', slot: 'sopar', slots: ['dinar'], name: 'Fajitas de pollastre amb verdures', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'tortilla_wrap', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'chicken_breast', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 120, portionLabel: 'petit', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-pollastre-teriyaki', slot: 'dinar', slots: ['sopar'], name: 'Pollastre teriyaki + arròs', tags: ['high_protein', 'homemade', 'post_workout'],
    ingredients: [
      { foodId: 'chicken_thigh', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'rice_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'vegetables', grams: 120, portionLabel: 'petit', precision: P },
      { foodId: 'honey', grams: 12, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-lluc-patata', slot: 'sopar', slots: ['dinar'], name: 'Lluç al forn amb patata i verdura', tags: ['high_protein'],
    ingredients: [
      { foodId: 'white_fish', grams: 200, portionLabel: 'gran', precision: P },
      { foodId: 'potato_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'vegetables', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-llom-moniato', slot: 'dinar', slots: ['sopar'], name: 'Llom de porc + moniato + amanida', tags: ['high_protein'],
    ingredients: [
      { foodId: 'pork_loin', grams: 160, portionLabel: 'normal', precision: P },
      { foodId: 'sweet_potato', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'lettuce', grams: 40, portionLabel: 'normal', precision: P },
      { foodId: 'tomato', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-quinoa-gall-dindi', slot: 'dinar', slots: ['sopar'], name: 'Bowl de quinoa, gall dindi i alvocat', tags: ['high_protein'],
    ingredients: [
      { foodId: 'quinoa', grams: 220, portionLabel: 'normal', precision: P },
      { foodId: 'turkey_breast', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'avocado', grams: 70, portionLabel: 'petit', precision: P },
      { foodId: 'tomato', grams: 80, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-sardines-pa', slot: 'sopar', name: 'Sardines amb pa integral i tomàquet', tags: ['high_protein', 'no_cook'],
    ingredients: [
      { foodId: 'sardines', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'bread_whole', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'tomato', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 8, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-bacalla-cigrons', slot: 'sopar', slots: ['dinar'], name: 'Bacallà amb cigrons i espinacs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'white_fish', grams: 180, portionLabel: 'normal', precision: P },
      { foodId: 'chickpeas_cooked', grams: 200, portionLabel: 'petit', precision: P },
      { foodId: 'spinach', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 12, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-raviolis-tomaquet', slot: 'sopar', slots: ['dinar'], name: 'Raviolis amb salsa de tomàquet i formatge', tags: ['homemade', 'quick'],
    ingredients: [
      { foodId: 'ravioli_cooked', grams: 300, portionLabel: 'gran', precision: P },
      { foodId: 'tomato_sauce', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 25, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-llibret-patata', slot: 'sopar', slots: ['dinar'], name: 'Llibret de pollastre + patata + amanida', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'llibret_pollastre', grams: 180, portionLabel: 'normal', precision: P },
      { foodId: 'potato_cooked', grams: 250, portionLabel: 'normal', precision: P },
      { foodId: 'lettuce', grams: 40, portionLabel: 'normal', precision: P },
      { foodId: 'tomato', grams: 80, portionLabel: 'petit', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-mandonguilles-arros', slot: 'dinar', slots: ['sopar'], name: 'Mandonguilles amb salsa i arròs', tags: ['high_protein', 'homemade'],
    ingredients: [
      { foodId: 'meatballs', grams: 200, portionLabel: 'gran', precision: P },
      { foodId: 'rice_cooked', grams: 220, portionLabel: 'petit', precision: P },
      { foodId: 'vegetables', grams: 100, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-croquetes-amanida', slot: 'sopar', name: 'Croquetes + amanida completa', tags: ['homemade'],
    ingredients: [
      { foodId: 'croquettes', grams: 180, portionLabel: 'normal', precision: P },
      { foodId: 'lettuce', grams: 50, portionLabel: 'normal', precision: P },
      { foodId: 'tomato', grams: 120, portionLabel: 'normal', precision: P },
      { foodId: 'egg', grams: 100, portionLabel: 'normal', precision: P },
      { foodId: 'olive_oil', grams: 10, portionLabel: 'petit', precision: P },
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

  {
    id: 'w-ber-wrap-gall-dindi', slot: 'berenar', slots: ['snack'], name: 'Wrap de gall dindi i formatge', tags: ['high_protein', 'quick', 'no_cook'],
    ingredients: [
      { foodId: 'tortilla_wrap', grams: 70, portionLabel: 'normal', precision: P },
      { foodId: 'turkey_breast', grams: 70, portionLabel: 'petit', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
      { foodId: 'lettuce', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-ber-torrada-alvocat-ou', slot: 'berenar', slots: ['snack'], name: 'Torrada integral amb alvocat i ou dur', tags: ['quick', 'no_cook'],
    ingredients: [
      { foodId: 'bread_whole', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'avocado', grams: 70, portionLabel: 'petit', precision: P },
      { foodId: 'egg', grams: 50, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-ber-cottage-poma', slot: 'berenar', slots: ['snack'], name: 'Formatge fresc + poma + fruits secs', tags: ['high_protein', 'quick', 'no_cook'],
    ingredients: [
      { foodId: 'cottage_cheese', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'apple', grams: 180, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-ber-skyr-maduixes', slot: 'berenar', slots: ['snack'], name: 'Skyr + maduixes + cereals + mel', tags: ['high_protein', 'quick'],
    ingredients: [
      { foodId: 'protein_yogurt', grams: 250, portionLabel: 'gran', precision: P },
      { foodId: 'strawberries', grams: 150, portionLabel: 'normal', precision: P },
      { foodId: 'cereal', grams: 30, portionLabel: 'petit', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
    ],
  },
  {
    id: 'w-ber-entrepa-pernil-dolc', slot: 'berenar', slots: ['snack'], name: 'Entrepà de pernil dolç i formatge', tags: ['high_protein', 'quick', 'no_cook'],
    ingredients: [
      { foodId: 'bread', grams: 80, portionLabel: 'normal', precision: P },
      { foodId: 'ham_cooked', grams: 60, portionLabel: 'normal', precision: P },
      { foodId: 'cheese', grams: 20, portionLabel: 'petit', precision: P },
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
  {
    id: 'w-snack-crema-arros-whey', slot: 'snack', slots: ['berenar'], name: "Crema d'arròs + proteïna (post-entreno)", tags: ['high_protein', 'quick', 'post_workout', 'supplement'],
    ingredients: [
      { foodId: 'rice_cream', grams: 50, portionLabel: 'petit', precision: P },
      { foodId: 'whey', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'honey', grams: 10, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-snack-iogurt-nous-mel', slot: 'snack', slots: ['berenar'], name: 'Iogurt grec + mel + fruits secs', tags: ['quick', 'no_cook'],
    ingredients: [
      { foodId: 'greek_yogurt', grams: 250, portionLabel: 'gran', precision: P },
      { foodId: 'honey', grams: 15, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 20, portionLabel: 'petit', precision: P },
    ],
  },
  {
    id: 'w-snack-fruita-formatge', slot: 'snack', slots: ['berenar'], name: 'Poma + formatge curat + fruits secs', tags: ['quick', 'no_cook'],
    ingredients: [
      { foodId: 'apple', grams: 180, portionLabel: 'normal', precision: P },
      { foodId: 'cured_cheese', grams: 30, portionLabel: 'normal', precision: P },
      { foodId: 'nuts', grams: 15, portionLabel: 'petit', precision: P },
    ],
  },
];
