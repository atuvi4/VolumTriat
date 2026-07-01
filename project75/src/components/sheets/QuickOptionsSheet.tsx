import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import { previewNutrition } from '../../nutrition/mealBuilder';
import type { MealRecipe } from '../../nutrition/nutritionTypes';

interface Props {
  title: string;
  sub: string;
  options: MealRecipe[];
}

export default function QuickOptionsSheet({ title, sub, options }: Props) {
  const { addRecipe, closeSheet } = useApp();
  return (
    <div>
      <SheetHeader title={title} sub={sub} />
      {options.map((r) => {
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
