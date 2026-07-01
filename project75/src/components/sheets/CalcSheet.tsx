import { SheetHeader } from '../Sheet';
import Icon from '../Icon';
import type { ResolvedMeal } from '../../nutrition/nutritionTypes';
import { SOURCE_META, CONFIDENCE_LABEL, PRECISION_LABEL } from '../../nutrition/nutritionSources';

export default function CalcSheet({ meal }: { meal: ResolvedMeal }) {
  const n = meal.nutrition;
  return (
    <div>
      <SheetHeader title={meal.name} sub="Càlcul per ingredients · nutrició calculada, no escrita a mà" />

      <div className="mt-2 border border-line rounded-[14px] divide-y divide-line">
        {meal.ingredients.map((ing) => (
          <div key={ing.foodId} className="flex items-center justify-between px-3.5 py-2.5">
            <div>
              <div className="font-semibold text-[14px]">{ing.name}</div>
              <div className="text-[11.5px] text-faint">
                {ing.grams} g{ing.portionLabel ? ` · ${ing.portionLabel}` : ''} · {PRECISION_LABEL[ing.precision]}
              </div>
            </div>
            <div className="text-right text-[13px] text-muted font-semibold">
              {ing.nutrition.kcal} kcal
              <div className="text-[11.5px] text-faint">{ing.nutrition.protein}g P</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        {[
          ['Kcal', n.kcal],
          ['Proteïna', `${n.protein}g`],
          ['Carbs', `${n.carbs}g`],
          ['Greix', `${n.fat}g`],
        ].map(([l, v]) => (
          <div key={l} className="bg-surface2 border border-line rounded-xl py-2.5">
            <div className="text-[16px] font-extrabold">{v}</div>
            <div className="text-[11px] text-muted font-semibold">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-info-soft rounded-xl p-3.5 text-[13px]">
        <div className="flex items-center gap-2 font-bold text-info mb-1.5">
          <Icon name="info" size={16} /> Transparència de les dades
        </div>
        <p className="m-0 text-ink/80">
          Precisió de l'àpat: <b>{PRECISION_LABEL[meal.precision]}</b> · confiança <b>{CONFIDENCE_LABEL[meal.confidence]}</b>.
        </p>
        <p className="m-0 mt-1.5 text-ink/80">
          Fonts: {meal.sources.map((s) => SOURCE_META[s].label).join(' · ')}.
        </p>
        <p className="m-0 mt-1.5 text-faint">
          Per millorar la precisió, pesa aquest àpat 1-2 cops i desa'l com a plantilla personal (properament).
        </p>
      </div>
    </div>
  );
}
