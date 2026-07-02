import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import type { ResolvedMeal } from '../../nutrition/nutritionTypes';

const PRESETS = [25, 50, 75, 100];

/** Ració parcial: quin percentatge de l'àpat proposat has menjat.
 *  L'app calcula kcal/proteïna de forma proporcional (estimació). */
export default function PartialSheet({ meal, onSave }: { meal: ResolvedMeal; onSave?: (pct: number) => void }) {
  const { partialMeal, closeSheet } = useApp();
  const [pct, setPct] = useState(meal.partialPct ?? 50);
  const f = Math.max(1, Math.min(100, pct)) / 100;
  const kcal = Math.round(meal.nutrition.kcal * f);
  const prot = Math.round(meal.nutrition.protein * f);

  const save = () => {
    if (onSave) {
      onSave(pct); // el callable decideix tancar/confirmar
    } else {
      partialMeal(meal.id, pct);
      closeSheet();
    }
  };

  return (
    <div>
      <SheetHeader title={`Ració parcial · «${meal.slot}»`} sub="Quina part de l'àpat proposat has menjat?" />

      <div className="grid grid-cols-4 gap-2 mt-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPct(p)}
            className={`rounded-xl py-3 font-bold text-[15px] border transition-colors ${
              pct === p ? 'bg-accent text-white border-accent' : 'bg-surface2 border-line2 hover:border-faint'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <label className="block mt-4 text-[12.5px] font-semibold text-muted">O un percentatge exacte</label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          min={1}
          max={100}
          inputMode="numeric"
          value={pct}
          onChange={(e) => setPct(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
          className="flex-1 bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[16px] font-bold focus:outline-none focus:border-accent"
        />
        <span className="text-muted font-semibold">%</span>
      </div>

      <div className="mt-4 bg-surface2 border border-line rounded-xl px-4 py-3">
        <div className="text-[12px] font-semibold text-faint">Suma estimada</div>
        <div className="text-[17px] font-extrabold mt-0.5">
          {kcal} kcal · {prot} g proteïna
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-[12px] text-muted bg-info-soft rounded-xl px-3.5 py-2.5">
        <Icon name="info" size={15} className="text-info shrink-0 mt-0.5" />
        <span>Estimació basada en la ració parcial de la recepta, no un pesatge.</span>
      </div>

      <Button variant="primary" className="w-full mt-4" icon="check" onClick={save}>
        Desar ració parcial
      </Button>
    </div>
  );
}
