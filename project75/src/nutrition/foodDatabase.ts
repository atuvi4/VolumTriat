import type { FoodItem } from './nutritionTypes';

/* =========================================================
   Base local d'aliments habituals per volum.
   NOTA D'HONESTEDAT (veure README_NUTRITION.md):
   Els valors per 100 g són valors de REFERÈNCIA ESTÀNDARD compilats
   (alineats amb rangs USDA/BEDCA típics), NO mesures de laboratori
   d'aquesta app. Per això la confiança màxima aquí és "medium".
   Els aliments molt variables per marca/tall es marquen "low" i
   alguns com "placeholder_pending_verification" fins connectar API.
   ========================================================= */

export const FOODS: FoodItem[] = [
  {
    id: 'rice_cooked', name: 'Arròs blanc cuit', category: 'carb',
    kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'pasta_cooked', name: 'Pasta cuita', category: 'carb',
    kcalPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9, fiberPer100g: 1.8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 220, gran: 300, 'molt gran': 380 },
  },
  {
    id: 'bread', name: 'Pa', category: 'carb',
    kcalPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7,
    source: 'local_verified', confidence: 'low', // molt variable per tipus de pa
    portions: { petit: 40, normal: 80, gran: 120, 'molt gran': 160 },
  },
  {
    id: 'oats', name: 'Civada (flocs)', category: 'carb',
    kcalPer100g: 379, proteinPer100g: 13, carbsPer100g: 67, fatPer100g: 6.5, fiberPer100g: 10,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 30, normal: 40, gran: 60, 'molt gran': 80 },
  },
  {
    id: 'potato_cooked', name: 'Patata cuita', category: 'carb',
    kcalPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 1.8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'chicken_breast', name: 'Pit de pollastre (cuit)', category: 'protein',
    kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'egg', name: 'Ou', category: 'protein', servingName: '1 ou ≈ 50 g',
    kcalPer100g: 143, proteinPer100g: 13, carbsPer100g: 0.7, fatPer100g: 9.5,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 50, normal: 100, gran: 150, 'molt gran': 200 },
  },
  {
    id: 'tuna_can', name: 'Tonyina (al natural, llauna)', category: 'protein',
    kcalPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 60, normal: 100, gran: 140, 'molt gran': 180 },
  },
  {
    id: 'salmon', name: 'Salmó', category: 'protein',
    kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'beef_lean', name: 'Vedella magra (cuita)', category: 'protein',
    kcalPer100g: 187, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'greek_yogurt', name: 'Iogurt grec', category: 'dairy',
    kcalPer100g: 97, proteinPer100g: 9, carbsPer100g: 4, fatPer100g: 5,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 125, normal: 200, gran: 300, 'molt gran': 400 },
  },
  {
    id: 'milk_whole', name: 'Llet sencera', category: 'dairy',
    kcalPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 200, normal: 300, gran: 400, 'molt gran': 500 },
  },
  {
    // Etiqueta real (finditapp, juliol 2026). ATENCIÓ: NO és la línia «+Proteínas»
    // — és beguda làctia ensucrada (2,3 g prot/100 ml). Va bé com a calories
    // líquides de volum; per proteïna, whey/iogurt o el batut +Proteínas escanejat.
    id: 'milk_drink_fruit', name: 'Beguda làctia maduixa-plàtan (Mercadona)', category: 'dairy',
    kcalPer100g: 76, proteinPer100g: 2.3, carbsPer100g: 12.4, fatPer100g: 1.9,
    source: 'local_verified', confidence: 'medium', // etiqueta de marca: pot canviar de formulació
    portions: { petit: 150, normal: 250, gran: 330, 'molt gran': 500 },
  },
  {
    id: 'cheese', name: 'Formatge semi', category: 'dairy',
    kcalPer100g: 350, proteinPer100g: 25, carbsPer100g: 2, fatPer100g: 27,
    source: 'local_verified', confidence: 'low', // molt variable per tipus
    portions: { petit: 20, normal: 30, gran: 50, 'molt gran': 70 },
  },
  {
    id: 'olive_oil', name: "Oli d'oliva", category: 'fat',
    kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 10, normal: 15, gran: 20, 'molt gran': 25 },
  },
  {
    id: 'nuts', name: 'Fruits secs (mescla)', category: 'fat',
    kcalPer100g: 607, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 9,
    source: 'local_verified', confidence: 'low', // varia molt per mescla
    portions: { petit: 15, normal: 25, gran: 40, 'molt gran': 60 },
  },
  {
    id: 'peanut_butter', name: 'Crema de cacauet', category: 'fat',
    kcalPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 15, normal: 20, gran: 30, 'molt gran': 40 },
  },
  {
    id: 'banana', name: 'Plàtan', category: 'fruit', servingName: '1 plàtan ≈ 120 g',
    kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 120, gran: 160, 'molt gran': 200 },
  },
  {
    id: 'lentils_cooked', name: 'Llenties cuites', category: 'legume',
    kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'chickpeas_cooked', name: 'Cigrons cuits', category: 'legume',
    kcalPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'cereal', name: 'Cereals', category: 'carb',
    kcalPer100g: 375, proteinPer100g: 8, carbsPer100g: 84, fatPer100g: 2, fiberPer100g: 6,
    source: 'placeholder_pending_verification', confidence: 'low', // depèn totalment de la marca
    portions: { petit: 30, normal: 50, gran: 80, 'molt gran': 120 },
  },
  {
    id: 'honey', name: 'Mel', category: 'sweetener',
    kcalPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 10, normal: 15, gran: 25, 'molt gran': 40 },
  },
  {
    id: 'whey', name: 'Proteïna whey', category: 'supplement', isSupplement: true,
    servingName: '1 cassó ≈ 30 g',
    kcalPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 20, normal: 30, gran: 40, 'molt gran': 50 },
  },
  {
    id: 'couscous_cooked', name: 'Cuscús cuit', category: 'carb',
    kcalPer100g: 112, proteinPer100g: 3.8, carbsPer100g: 23, fatPer100g: 0.2, fiberPer100g: 1.4,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 220, gran: 300, 'molt gran': 380 },
  },
  {
    id: 'turkey_breast', name: 'Gall dindi (pit, cuit)', category: 'protein',
    kcalPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'beef_mince_cooked', name: 'Carn picada (cuita)', category: 'protein',
    kcalPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 17,
    source: 'local_verified', confidence: 'low', // varia molt pel % de greix
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'protein_yogurt', name: 'Iogurt proteic (skyr)', category: 'dairy',
    kcalPer100g: 60, proteinPer100g: 10, carbsPer100g: 4, fatPer100g: 0.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 200, gran: 300, 'molt gran': 400 },
  },
  {
    id: 'olives', name: 'Olives', category: 'fat',
    kcalPer100g: 145, proteinPer100g: 1, carbsPer100g: 4, fatPer100g: 15, fiberPer100g: 3,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 20, normal: 30, gran: 50, 'molt gran': 70 },
  },
  {
    id: 'vegetables', name: 'Verdura (mescla)', category: 'fruit', // s'agrupa a "Fruita / verdura"
    kcalPer100g: 45, proteinPer100g: 2.5, carbsPer100g: 7, fatPer100g: 0.5, fiberPer100g: 3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'fries', name: 'Patates fregides', category: 'carb',
    kcalPer100g: 312, proteinPer100g: 3.4, carbsPer100g: 41, fatPer100g: 15, fiberPer100g: 3.8,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 100, normal: 150, gran: 250, 'molt gran': 350 },
  },
  {
    id: 'ham_cooked', name: 'Pernil dolç', category: 'protein',
    kcalPer100g: 110, proteinPer100g: 18, carbsPer100g: 1, fatPer100g: 3.5,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 40, normal: 60, gran: 90, 'molt gran': 120 },
  },
  {
    id: 'ham_cured', name: 'Pernil serrà', category: 'protein',
    kcalPer100g: 240, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 13,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 30, normal: 50, gran: 80, 'molt gran': 110 },
  },
  {
    id: 'pork_loin', name: 'Llom de porc (cuit)', category: 'protein',
    kcalPer100g: 210, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 11,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'sausage', name: 'Salsitxa / frankfurt', category: 'protein',
    kcalPer100g: 270, proteinPer100g: 12, carbsPer100g: 3, fatPer100g: 23,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 50, normal: 100, gran: 150, 'molt gran': 200 },
  },
  {
    id: 'white_fish', name: 'Peix blanc (lluç, bacallà)', category: 'protein',
    kcalPer100g: 90, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 1.5,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'cottage_cheese', name: 'Formatge fresc / cottage', category: 'dairy',
    kcalPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'plain_yogurt', name: 'Iogurt natural', category: 'dairy',
    kcalPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 125, normal: 200, gran: 300, 'molt gran': 400 },
  },
  {
    id: 'apple', name: 'Poma', category: 'fruit',
    kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 130, normal: 180, gran: 220, 'molt gran': 260 },
  },
  {
    id: 'tomato', name: 'Tomàquet', category: 'fruit',
    kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'pizza', name: 'Pizza', category: 'carb',
    kcalPer100g: 266, proteinPer100g: 11, carbsPer100g: 33, fatPer100g: 10,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'chocolate', name: 'Xocolata', category: 'other',
    kcalPer100g: 546, proteinPer100g: 5, carbsPer100g: 61, fatPer100g: 31,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 20, normal: 30, gran: 50, 'molt gran': 80 },
  },

  /* ---- Més proteïnes ---- */
  {
    id: 'chicken_thigh', name: 'Cuixa de pollastre (cuita)', category: 'protein',
    kcalPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'beef_steak', name: 'Vedella (filet, cuit)', category: 'protein',
    kcalPer100g: 217, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'prawns', name: 'Gambes / marisc', category: 'protein',
    kcalPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 120, gran: 180, 'molt gran': 240 },
  },
  {
    id: 'sardines', name: 'Sardines', category: 'protein',
    kcalPer100g: 208, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 11,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 120, gran: 160, 'molt gran': 200 },
  },
  {
    id: 'egg_white', name: "Clares d'ou", category: 'protein',
    kcalPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 60, normal: 120, gran: 180, 'molt gran': 240 },
  },

  /* ---- Més hidrats ---- */
  {
    id: 'sweet_potato', name: 'Moniato (cuit)', category: 'carb',
    kcalPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1, fiberPer100g: 3.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'quinoa', name: 'Quinoa cuita', category: 'carb',
    kcalPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, fiberPer100g: 2.8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 220, gran: 300, 'molt gran': 380 },
  },
  {
    id: 'bread_whole', name: 'Pa integral', category: 'carb',
    kcalPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, fiberPer100g: 7,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 40, normal: 80, gran: 120, 'molt gran': 160 },
  },
  {
    id: 'corn', name: 'Blat de moro', category: 'carb',
    kcalPer100g: 96, proteinPer100g: 3.4, carbsPer100g: 21, fatPer100g: 1.5, fiberPer100g: 2.4,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 140, gran: 200, 'molt gran': 260 },
  },
  {
    id: 'white_beans', name: 'Mongetes cuites', category: 'legume',
    kcalPer100g: 139, proteinPer100g: 9, carbsPer100g: 25, fatPer100g: 0.5, fiberPer100g: 6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },

  /* ---- Més làctics ---- */
  {
    id: 'mozzarella', name: 'Mozzarella', category: 'dairy',
    kcalPer100g: 280, proteinPer100g: 22, carbsPer100g: 2.2, fatPer100g: 21,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 30, normal: 50, gran: 80, 'molt gran': 125 },
  },
  {
    id: 'cured_cheese', name: 'Formatge curat', category: 'dairy',
    kcalPer100g: 390, proteinPer100g: 26, carbsPer100g: 1.5, fatPer100g: 32,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 20, normal: 30, gran: 50, 'molt gran': 70 },
  },

  /* ---- Més fruita / verdura ---- */
  {
    id: 'orange', name: 'Taronja', category: 'fruit',
    kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, fiberPer100g: 2.4,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 130, normal: 180, gran: 230, 'molt gran': 280 },
  },
  {
    id: 'strawberries', name: 'Maduixes', category: 'fruit',
    kcalPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, fiberPer100g: 2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'grapes', name: 'Raïm', category: 'fruit',
    kcalPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2, fiberPer100g: 0.9,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 120, gran: 180, 'molt gran': 240 },
  },
  {
    id: 'broccoli', name: 'Bròquil', category: 'fruit',
    kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 2.6,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  },
  {
    id: 'spinach', name: 'Espinacs', category: 'fruit',
    kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 120, gran: 180, 'molt gran': 240 },
  },
  {
    id: 'carrot', name: 'Pastanaga', category: 'fruit',
    kcalPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 80, normal: 120, gran: 180, 'molt gran': 240 },
  },
  {
    id: 'avocado', name: 'Alvocat', category: 'fat',
    kcalPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 70, normal: 100, gran: 150, 'molt gran': 200 },
  },

  /* ---- Hamburgueses i acompanyaments ---- */
  {
    id: 'burger_beef', name: 'Hamburguesa de vedella (cuita)', category: 'protein',
    servingName: '1 hamburguesa ≈ 120 g',
    kcalPer100g: 250, proteinPer100g: 26, carbsPer100g: 1, fatPer100g: 17,
    source: 'local_verified', confidence: 'low', // varia molt pel % de greix i la marca
    portions: { petit: 90, normal: 120, gran: 180, 'molt gran': 240 },
  },
  {
    id: 'burger_chicken', name: 'Hamburguesa de pollastre (cuita)', category: 'protein',
    servingName: '1 hamburguesa ≈ 110 g',
    kcalPer100g: 172, proteinPer100g: 20, carbsPer100g: 3, fatPer100g: 9,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 90, normal: 110, gran: 160, 'molt gran': 220 },
  },
  {
    id: 'burger_bun', name: "Pa d'hamburguesa", category: 'carb',
    servingName: '1 pa ≈ 60 g',
    kcalPer100g: 270, proteinPer100g: 9, carbsPer100g: 48, fatPer100g: 4.5, fiberPer100g: 2.5,
    source: 'local_verified', confidence: 'low', // depèn del tipus (brioix, integral…)
    portions: { petit: 50, normal: 60, gran: 75, 'molt gran': 90 },
  },
  {
    id: 'bacon', name: 'Bacó (cuit)', category: 'protein',
    kcalPer100g: 540, proteinPer100g: 37, carbsPer100g: 1.4, fatPer100g: 42,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 15, normal: 25, gran: 40, 'molt gran': 60 },
  },
  {
    id: 'cheese_slice', name: 'Formatge en llesques (cheddar)', category: 'dairy',
    servingName: '1 llesca ≈ 20 g',
    kcalPer100g: 330, proteinPer100g: 18, carbsPer100g: 6, fatPer100g: 26,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 20, normal: 40, gran: 60, 'molt gran': 80 },
  },
  {
    id: 'mayo', name: 'Maionesa', category: 'fat',
    kcalPer100g: 680, proteinPer100g: 1, carbsPer100g: 1.5, fatPer100g: 75,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 10, normal: 15, gran: 25, 'molt gran': 40 },
  },
  {
    id: 'ketchup', name: 'Ketchup', category: 'sweetener',
    kcalPer100g: 102, proteinPer100g: 1.2, carbsPer100g: 24, fatPer100g: 0.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 10, normal: 15, gran: 25, 'molt gran': 40 },
  },
  {
    id: 'bbq_sauce', name: 'Salsa barbacoa', category: 'sweetener',
    kcalPer100g: 172, proteinPer100g: 0.8, carbsPer100g: 41, fatPer100g: 0.6,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 10, normal: 20, gran: 30, 'molt gran': 45 },
  },
  {
    id: 'onion', name: 'Ceba', category: 'fruit',
    kcalPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1, fiberPer100g: 1.7,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 30, normal: 60, gran: 100, 'molt gran': 150 },
  },
  {
    id: 'lettuce', name: 'Enciam', category: 'fruit',
    kcalPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2, fiberPer100g: 1.3,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 20, normal: 40, gran: 70, 'molt gran': 100 },
  },
  {
    id: 'pickles', name: 'Cogombrets en vinagre', category: 'fruit',
    kcalPer100g: 12, proteinPer100g: 0.5, carbsPer100g: 2.3, fatPer100g: 0.2, fiberPer100g: 1.2,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 15, normal: 30, gran: 50, 'molt gran': 80 },
  },

  /* ---- Altres bàsics habituals ---- */
  {
    id: 'rice_brown', name: 'Arròs integral cuit', category: 'carb',
    kcalPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatPer100g: 0.9, fiberPer100g: 1.8,
    source: 'local_verified', confidence: 'medium',
    portions: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  },
  {
    id: 'sliced_bread', name: 'Pa de motlle', category: 'carb',
    servingName: '1 llesca ≈ 30 g',
    kcalPer100g: 265, proteinPer100g: 8, carbsPer100g: 49, fatPer100g: 4, fiberPer100g: 3,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 30, normal: 60, gran: 90, 'molt gran': 120 },
  },
  {
    id: 'crisps', name: 'Patates xips (bossa)', category: 'carb',
    kcalPer100g: 536, proteinPer100g: 6, carbsPer100g: 53, fatPer100g: 34, fiberPer100g: 4,
    source: 'local_verified', confidence: 'low',
    portions: { petit: 25, normal: 40, gran: 60, 'molt gran': 90 },
  },
];

export const FOOD_MAP: Record<string, FoodItem> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): FoodItem | undefined {
  return FOOD_MAP[id];
}

// Ració per defecte segons categoria (fallback si un aliment no defineix portions)
export const DEFAULT_PORTIONS: Record<string, Record<string, number>> = {
  carb: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  protein: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
  dairy: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  fat: { petit: 10, normal: 15, gran: 20, 'molt gran': 30 },
  fruit: { petit: 100, normal: 130, gran: 180, 'molt gran': 220 },
  legume: { petit: 150, normal: 250, gran: 350, 'molt gran': 450 },
  sweetener: { petit: 10, normal: 15, gran: 25, 'molt gran': 40 },
  supplement: { petit: 20, normal: 30, gran: 40, 'molt gran': 50 },
  other: { petit: 100, normal: 150, gran: 200, 'molt gran': 250 },
};
