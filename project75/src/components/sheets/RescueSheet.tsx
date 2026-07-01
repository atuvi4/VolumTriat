import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import { SHAKE_RECIPES } from '../../nutrition/mealPlans';
import { previewNutrition } from '../../nutrition/mealBuilder';

export default function RescueSheet() {
  const { addRecipe, closeSheet } = useApp();
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
              addRecipe(r);
              closeSheet();
            }}
          />
        );
      })}
    </div>
  );
}
