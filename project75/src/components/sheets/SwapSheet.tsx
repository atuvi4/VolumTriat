import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import { RECIPE_POOL } from '../../nutrition/mealPlans';
import { previewNutrition } from '../../nutrition/mealBuilder';
import type { ResolvedMeal } from '../../nutrition/nutritionTypes';

export default function SwapSheet({ meal }: { meal: ResolvedMeal }) {
  const { state, swapMeal, closeSheet } = useApp();
  const opts = RECIPE_POOL.filter(
    (r) => r.name !== meal.name && !state.dislikes.some((d) => r.name.toLowerCase().includes(d.toLowerCase())),
  ).slice(0, 5);

  return (
    <div>
      <SheetHeader title={`Canviar «${meal.slot}»`} sub="Alternatives calculades, evitant el que et cansa" />
      {opts.map((r) => {
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
    </div>
  );
}
