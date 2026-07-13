import { SheetHeader } from '../Sheet';
import Icon from '../Icon';
import type { ResolvedMeal } from '../../nutrition/nutritionTypes';
import { SOURCE_META, CONFIDENCE_LABEL, PRECISION_LABEL } from '../../nutrition/nutritionSources';
import { displayUnitOf } from '../../nutrition/foodDatabase';
import { mealStatus } from '../../utils/goals';
import { mealDataKind, sourceLabelForMeal, shouldWarnLowConfidence } from '../../nutrition/nutritionConfidencePolicy';

const SUB_BY_KIND: Record<string, string> = {
  manual_label: "Etiqueta introduïda per tu · macros de l'etiqueta",
  manual: 'Dada manual introduïda per tu · no verificada per base nutricional',
  purchase_estimate: 'Estimació de compra ràpida · macros no confirmades',
  calculated: 'Càlcul per ingredients · base local (estimació de referència)',
};

export default function CalcSheet({ meal }: { meal: ResolvedMeal }) {
  const n = meal.nutrition;
  const status = mealStatus(meal);
  const kind = mealDataKind(meal, status);
  // La dada manual no té desglòs d'ingredients fiable: mostrem la dada, no un càlcul.
  const showIngredients = kind !== 'manual' && kind !== 'manual_label' && meal.ingredients.length > 0;
  const warnLow = shouldWarnLowConfidence(meal, status);
  const hasEdibleSplit = meal.ingredients.some((ing) => ing.purchaseGrams != null && ing.purchaseGrams !== ing.grams);
  return (
    <div>
      <SheetHeader title={meal.name} sub={SUB_BY_KIND[kind]} />

      {warnLow && (
        <div className="mt-2 flex items-start gap-2 text-[12.5px] bg-warn-soft text-warn rounded-xl px-3.5 py-2.5 font-semibold">
          <Icon name="alert" size={15} className="shrink-0 mt-0.5" />
          Estimació baixa: revisa l'etiqueta si aquest àpat és important per la proteïna.
        </div>
      )}

      {showIngredients && (
      <div className="mt-2 border border-line rounded-[14px] divide-y divide-line">
        {meal.ingredients.map((ing) => (
          <div key={ing.foodId} className="flex items-center justify-between px-3.5 py-2.5">
            <div>
              <div className="font-semibold text-[14px]">{ing.name}</div>
              <div className="text-[11.5px] text-faint">
                {ing.purchaseGrams != null && ing.purchaseGrams !== ing.grams
                  ? `~${ing.purchaseGrams} g compra · ${ing.grams} g comestible`
                  : `${ing.grams} ${displayUnitOf(ing.foodId)}`}
                {ing.portionLabel ? ` · ${ing.portionLabel}` : ''} · {PRECISION_LABEL[ing.precision]} · {SOURCE_META[ing.source].short}
              </div>
            </div>
            <div className="text-right text-[13px] text-muted font-semibold">
              {ing.nutrition.kcal} kcal
              <div className="text-[11.5px] text-faint">{ing.nutrition.protein}g P</div>
            </div>
          </div>
        ))}
      </div>
      )}

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
          Font: {sourceLabelForMeal(meal, status)}.
        </p>
        {kind === 'calculated' && (
          <p className="m-0 mt-1.5 text-faint">
            Base: {meal.sources.map((s) => SOURCE_META[s].label).join(' · ')}.
          </p>
        )}
        {hasEdibleSplit && (
          <p className="m-0 mt-1.5 text-ink/80">
            Calories calculades sobre la <b>part comestible</b> (no sobre el pes de compra amb pell).
          </p>
        )}
        <p className="m-0 mt-1.5 text-faint">
          Per millorar la precisió, pesa aquest àpat 1-2 cops i desa'l com a plantilla personal (properament).
        </p>
      </div>
    </div>
  );
}
