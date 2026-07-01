# Nutrition Engine — Project75

Sistema nutricional tipus dietista esportiu digital. **Principi rector: mai fingir precisió.** Si una dada és estimada, es diu; si està pendent de verificar, es marca.

## Mapa de fitxers

| Fitxer | Responsabilitat |
|--------|-----------------|
| `nutritionTypes.ts` | Tots els tipus: `FoodItem`, `MealIngredient`, `MealRecipe`, `ResolvedMeal`, `NutritionTargets`, `WeeklyAdjustment`. |
| `nutritionSources.ts` | Metadades de fonts, etiquetes de confiança/precisió, càlcul del "pitjor cas" d'una recepta. |
| `foodDatabase.ts` | Base local d'aliments (per 100 g) + racions + fallback per categoria. |
| `nutritionCalculator.ts` | Matemàtica pura: nutrició d'un aliment/quantitat, BMR (Mifflin), rang TDEE. |
| `mealBuilder.ts` | Resol una `MealRecipe` → `ResolvedMeal` amb nutrició **calculada**. |
| `mealPlans.ts` | Receptes (dia base, alternatives, batuts, sense cuinar, fora). |
| `nutritionTargets.ts` | Objectius (kcal, proteïna, greix, carbs, pujada setmanal) + explicació. |
| `adjustmentRules.ts` | Ajust setmanal per tendència de pes (no reacciona a un sol dia). |
| `apiAdapters/` | Adaptadors OFF / USDA / BEDCA / Nutritionix (mapeig + crides segures). |

## Com funciona (flux)

1. Un **àpat és una recepta** (`MealRecipe`) = llista d'ingredients en grams, no kcal escrites a mà.
2. `resolveRecipe()` busca cada `FoodItem` a la base, calcula la nutrició (`calcFood`), la suma i determina:
   - **precisió** de l'àpat = la pitjor dels ingredients (`weighed` > `estimated_portion` > `manual_estimate`),
   - **confiança** = la pitjor dels ingredients (`high` > `medium` > `low`),
   - **fonts** = conjunt únic de fonts usades.
3. La UI mostra kcal/macros + "Estimació · precisió mitjana · Fonts: …" + botó **Veure càlcul** (desglossament per ingredient).

## Quines dades són verificades i quines no

- La base local usa **valors de referència estàndard compilats** (alineats amb rangs típics USDA/BEDCA). **No** són mesures de laboratori d'aquesta app → per això la confiança màxima local és **`medium`**.
- Aliments molt variables (pa, formatge, fruits secs) → **`low`**.
- `cereal` → **`placeholder_pending_verification`** (depèn 100% de la marca; s'ha de substituir per API/etiqueta).
- Plats "fora de casa" (`OUTSIDE_RECIPES`) → precisió `manual_estimate` (orientatius).
- Confiança **`high`** es reserva per a fonts oficials (USDA) o productes escanejats verificats.

## APIs: estat i claus

| API | Estat | Clau |
|-----|-------|------|
| Open Food Facts | Adaptador + serverless llest (`/api/food-search?source=off`, `/api/barcode`). Públic. | No en cal |
| USDA FoodData Central | Adaptador + serverless llest; **retorna 501 fins configurar la clau**. | `USDA_API_KEY` (servidor) |
| BEDCA | Adaptador **placeholder**; sense API pública estable. S'integraria via dataset/CSV propi. | — |
| Nutritionix (llenguatge natural) | Adaptador + serverless llest; **501 fins configurar claus**. | `NUTRITIONIX_APP_ID`, `NUTRITIONIX_APP_KEY` (servidor) |

## Variables d'entorn (seguretat)

- **Cap clau privada amb prefix `VITE_`** (s'exposaria al bundle del frontend).
- Les claus privades només les llegeixen les funcions de `/api` (serverless) al servidor.
- Còpia `.env.example` → configura a Vercel (*Project Settings → Environment Variables*).
- El frontend crida sempre `/api/*`; el servidor hi afegeix la clau i fa la petició real.

## Responsabilitat

L'app pot adaptar la dificultat i suggerir opcions líquides/simples quan hi ha poca gana o ànim baix, però **no diagnostica ni tracta res**. Els textos eviten afirmacions mèdiques i deixen clar que són estimacions.
