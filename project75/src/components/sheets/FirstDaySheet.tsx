import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Icon from '../Icon';
import { defaultDayRecipes } from '../../nutrition/mealPlans';
import { previewNutrition } from '../../nutrition/mealBuilder';
import { goalsFor } from '../../utils/goals';
import { nf } from '../../utils/format';

/** Resum del primer dia: menús base + objectiu. Informatiu (preparació). */
export default function FirstDaySheet() {
  const { state } = useApp();
  const recipes = defaultDayRecipes();
  const g = goalsFor(state);
  const totalKcal = recipes.reduce((s, r) => s + previewNutrition(r).kcal, 0);
  const totalProt = recipes.reduce((s, r) => s + previewNutrition(r).protein, 0);

  return (
    <div>
      <SheetHeader title="El teu primer dia" sub="Menú base calculat. El podràs canviar cada àpat." />
      <div className="border border-line rounded-[14px] divide-y divide-line mt-2">
        {recipes.map((r) => {
          const n = previewNutrition(r);
          return (
            <div key={r.id} className="flex items-center justify-between px-3.5 py-2.5">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-faint font-bold">{r.slot}</div>
                <div className="font-semibold text-[14px]">{r.name}</div>
              </div>
              <div className="text-right text-[12.5px] text-muted font-semibold">
                {n.kcal} kcal<div className="text-faint">{n.protein}g P</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 bg-accent-soft rounded-xl px-3.5 py-3 text-[13.5px] text-accent-strong font-semibold">
        <Icon name="target" size={16} />
        Total del dia: ~{nf(totalKcal)} kcal · {totalProt} g proteïna (objectiu {nf(g.kcal)} kcal / {g.prot} g)
      </div>
      <p className="text-[12px] text-faint mt-2 m-0">
        El Dia 1 no ha de ser perfecte: completar la majoria d'ingestes ja és guanyar.
      </p>
    </div>
  );
}
