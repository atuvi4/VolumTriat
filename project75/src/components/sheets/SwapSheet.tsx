import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import Icon from '../Icon';
import { swapOptionsFor } from '../../nutrition/mealPlans';
import { rankSwapOptions } from '../../brain/brain';
import { previewNutrition } from '../../nutrition/mealBuilder';
import { generateMealOptionsPro } from '../../nutrition/proMealGenerator';
import { eatenThemesToday, detectThemes, varietyRepeatScore } from '../../nutrition/dailyVariety';
import type { MealRecipe, MealSlot, ResolvedMeal } from '../../nutrition/nutritionTypes';

const SLOT_PREP: Record<MealSlot, string> = {
  esmorzar: "d'esmorzar",
  dinar: 'de dinar',
  berenar: 'de berenar',
  sopar: 'de sopar',
  snack: 'de snack',
};

const INITIAL = 5;
const PRO_INITIAL = 3;

/** Substitueix la recepta proposada del pla per una altra equivalent del mateix
 *  àpat (abans de menjar). No registra res menjat: això ho fa "Canviat". */
export default function SwapSheet({ meal }: { meal: ResolvedMeal }) {
  const { state, swapMeal, closeSheet } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [showMorePro, setShowMorePro] = useState(false);

  // Varietat diària: baixa (sense eliminar) les opcions que repeteixen un aliment
  // base ja menjat avui. Ordre estable: manté la priorització de sota dins l'empat.
  const eatenThemes = eatenThemesToday(state.meals);
  const recipeThemes = (r: MealRecipe) => detectThemes({ text: r.name, foodIds: r.ingredients.map((i) => i.foodId) });
  const byVariety = (list: MealRecipe[]) =>
    list
      .map((r, i) => ({ r, i, p: varietyRepeatScore(recipeThemes(r), eatenThemes) }))
      .sort((a, b) => a.p - b.p || a.i - b.i)
      .map((x) => x.r);

  // Alternatives locals (per slot, evita dislikes) + Brain + varietat diària.
  const all = byVariety(rankSwapOptions(swapOptionsFor(meal, state.dislikes), state.outcomes ?? []));
  const shown = showAll ? all : all.slice(0, INITIAL);

  // Opcions PRO: generades pel sistema (plantilles + target + preferències),
  // amb macros calculades pel Nutrition Engine. Local i instantani; si no
  // hi ha res, simplement no es mostra (mai error agressiu).
  const proAll = byVariety(
    generateMealOptionsPro({
      slot: meal.slot,
      targetKcal: meal.nutrition.kcal,
      targetProtein: meal.nutrition.protein,
      dayMode: state.dayMode,
      appetite: state.checkin?.appetite,
      dislikes: state.dislikes,
      recentMeals: state.meals.filter((m) => !m.isExtra).map((m) => m.name),
      outcomes: state.outcomes ?? [],
      maxOptions: 6,
    }).filter((r) => r.name !== meal.name),
  );
  const proShown = showMorePro ? proAll : proAll.slice(0, PRO_INITIAL);

  return (
    <div>
      <SheetHeader
        title={`Canviar «${meal.slot}»`}
        sub={`Opcions ${SLOT_PREP[meal.slot]} equivalents, evitant el que et cansa`}
      />

      {shown.length === 0 && proAll.length === 0 && (
        <p className="text-[13.5px] text-muted mt-2 mb-0">
          Ara mateix no hi ha més alternatives per aquest àpat.
        </p>
      )}

      {shown.map((r) => {
        const n = previewNutrition(r);
        return (
          <SheetOption
            key={r.id}
            label={r.name}
            meta={`${n.kcal} kcal · ${n.protein}g`}
            onClick={() => {
              swapMeal(meal.id, r);
              closeSheet();
            }}
          />
        );
      })}

      {!showAll && all.length > INITIAL && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center mt-2.5 text-[13px] font-semibold text-accent py-2"
        >
          Veure més opcions ({all.length - INITIAL})
        </button>
      )}

      {/* Opcions PRO — generades pel sistema, ajustades al teu objectiu */}
      {proAll.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent-strong mb-1.5">
            <Icon name="target" size={13} /> Opcions PRO · ajustades al teu objectiu
          </div>

          {proShown.map((r) => {
            const n = previewNutrition(r);
            return (
              <SheetOption
                key={r.id}
                label={r.name}
                meta={`${n.kcal} kcal · ${n.protein}g`}
                onClick={() => {
                  swapMeal(meal.id, r);
                  closeSheet();
                }}
              />
            );
          })}

          {!showMorePro && proAll.length > PRO_INITIAL && (
            <button
              onClick={() => setShowMorePro(true)}
              className="w-full text-center mt-2.5 text-[13px] font-semibold text-accent py-2"
            >
              Més varietat ({proAll.length - PRO_INITIAL})
            </button>
          )}

          <p className="text-[11.5px] text-faint mt-2 mb-0">
            Calculades per ingredients (base local). En desplegar les APIs, s'enriquiran amb dades reals.
          </p>
        </div>
      )}
    </div>
  );
}
