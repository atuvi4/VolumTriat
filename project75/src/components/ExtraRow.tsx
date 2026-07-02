import Icon from './Icon';
import { mealEaten } from '../utils/goals';
import type { ResolvedMeal } from '../nutrition/nutritionTypes';

const RELATED_LABEL: Record<'skipped' | 'partial' | 'changed', string> = {
  skipped: 'àpat saltat',
  partial: 'ració parcial',
  changed: 'àpat canviat',
};

/** Fila d'un extra manual o d'un ajust recomanat. No inventa dades:
 *  usa la recepta si és calculat i el registre manual si l'usuari l'ha introduït. */
export default function ExtraRow({ meal, onRemove }: { meal: ResolvedMeal; onRemove: () => void }) {
  const isAdjustment = meal.extraOrigin === 'adjustment';
  const eaten = mealEaten(meal) ?? meal.nutrition;
  const sourceText = meal.logged ? 'dada manual' : 'calculat per recepta';

  return (
    <div className="flex items-center justify-between gap-2 border border-line rounded-2xl p-[13px] mt-2 bg-surface2">
      <div className="min-w-0">
        {isAdjustment && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full mb-1">
            <Icon name="target" size={11} /> Ajust recomanat
          </span>
        )}
        <div className="font-bold text-[14.5px] truncate">{meal.name}</div>
        <div className="text-[13px] font-semibold text-muted mt-0.5">
          {eaten.kcal} kcal · {eaten.protein} g proteïna
        </div>
        {isAdjustment && (
          <div className="text-[12px] text-faint mt-0.5">
            {meal.relatedMealStatus
              ? `Per compensar: ${RELATED_LABEL[meal.relatedMealStatus]}`
              : meal.suggestedTiming}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1 text-[11.5px] font-semibold text-faint">
          <Icon name={isAdjustment ? 'cup' : 'edit'} size={12} />
          {isAdjustment ? 'Ajust' : 'Extra'} · {sourceText}
        </div>
        {meal.logged?.note && <div className="text-[12px] text-faint italic mt-0.5">«{meal.logged.note}»</div>}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 inline-flex items-center gap-1 text-muted hover:text-warn font-semibold text-[13px] px-2.5 py-2 rounded-[10px]"
      >
        <Icon name="x" size={16} /> Treure
      </button>
    </div>
  );
}
