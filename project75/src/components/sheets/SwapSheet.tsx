import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import { swapOptionsFor } from '../../nutrition/mealPlans';
import { previewNutrition } from '../../nutrition/mealBuilder';
import type { MealSlot, ResolvedMeal } from '../../nutrition/nutritionTypes';

const SLOT_PREP: Record<MealSlot, string> = {
  esmorzar: "d'esmorzar",
  dinar: 'de dinar',
  berenar: 'de berenar',
  sopar: 'de sopar',
  snack: 'de snack',
};

const INITIAL = 5;

/** Substitueix la recepta proposada del pla per una altra equivalent del mateix
 *  àpat (abans de menjar). No registra res menjat: això ho fa "Canviat". */
export default function SwapSheet({ meal }: { meal: ResolvedMeal }) {
  const { state, swapMeal, closeSheet } = useApp();
  const [showAll, setShowAll] = useState(false);

  const all = swapOptionsFor(meal, state.dislikes);
  const shown = showAll ? all : all.slice(0, INITIAL);

  return (
    <div>
      <SheetHeader
        title={`Canviar «${meal.slot}»`}
        sub={`Opcions ${SLOT_PREP[meal.slot]} equivalents, evitant el que et cansa`}
      />

      {shown.length === 0 && (
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
    </div>
  );
}
