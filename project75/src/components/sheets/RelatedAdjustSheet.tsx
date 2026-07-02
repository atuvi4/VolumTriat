import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import { mealEaten } from '../../utils/goals';
import type { ResolvedMeal } from '../../nutrition/nutritionTypes';

/** Confirmació en desfer/canviar un àpat que tenia ajustos recomanats relacionats.
 *  Mai esborra res sol: pregunta si treure només aquell ajust. */
export default function RelatedAdjustSheet({ meal, related }: { meal: ResolvedMeal; related: ResolvedMeal[] }) {
  const { removeExtra, closeSheet } = useApp();
  const totalKcal = related.reduce((s, r) => s + (mealEaten(r)?.kcal ?? r.nutrition.kcal), 0);

  return (
    <div>
      <SheetHeader
        title="Treure l'ajust recomanat?"
        sub={`Havies afegit un ajust per «${meal.slot}». Ara que l'has canviat, potser ja no cal.`}
      />

      <div className="mt-2 border border-line rounded-[14px] divide-y divide-line">
        {related.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-3.5 py-2.5">
            <div className="font-semibold text-[14px] truncate pr-2">{r.name}</div>
            <div className="text-[13px] text-muted font-semibold shrink-0">
              {mealEaten(r)?.kcal ?? r.nutrition.kcal} kcal
            </div>
          </div>
        ))}
      </div>

      <p className="text-[12.5px] text-muted mt-2 mb-0">
        Només afecta aquest ajust ({totalKcal} kcal). Els extres manuals i altres batuts no es toquen.
      </p>

      <div className="flex gap-2.5 mt-4">
        <Button variant="ghost" className="flex-1" onClick={closeSheet}>
          Mantenir-lo
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          icon="x"
          onClick={() => {
            related.forEach((r) => removeExtra(r.id));
            closeSheet();
          }}
        >
          Treure ajust
        </Button>
      </div>
    </div>
  );
}
