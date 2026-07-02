import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import { SHAKE_RECIPES } from '../../nutrition/mealPlans';
import { previewNutrition } from '../../nutrition/mealBuilder';
import type { AdjustContext } from '../../nutrition/nutritionTypes';

/** Mode rescat. Si s'obre des de «Ajust per arribar avui» rep un context i el que
 *  s'afegeix queda marcat com a ajust reversible; si no, és un extra normal. */
export default function RescueSheet({ adjust }: { adjust?: AdjustContext }) {
  const { addRecipe, addAdjustment, closeSheet } = useApp();
  return (
    <div>
      <SheetHeader title="Mode rescat" sub="Dies dolents o amb presses. Tria i suma calories fàcils:" />
      {SHAKE_RECIPES.map((r) => {
        const n = previewNutrition(r);
        return (
          <SheetOption
            key={r.id}
            label={r.name}
            meta={`${n.kcal} kcal · ${n.protein}g`}
            onClick={() => {
              if (adjust) addAdjustment(adjust, r);
              else addRecipe(r);
              closeSheet();
            }}
          />
        );
      })}
    </div>
  );
}
