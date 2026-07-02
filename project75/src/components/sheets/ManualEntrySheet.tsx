import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import type { ManualLog } from '../../nutrition/nutritionTypes';

interface Props {
  title: string;
  sub: string;
  initial?: ManualLog;
  submitLabel?: string;
  /** Si és false, no tanca el sheet en desar (el callback decideix què fer després). */
  closeOnSubmit?: boolean;
  onSubmit: (data: ManualLog) => void;
}

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[15px] font-semibold focus:outline-none focus:border-accent';

/** Formulari manual reutilitzat per «Àpat canviat» i «Extra».
 *  Calories i proteïna són obligatòries; nom i nota, opcionals.
 *  Deixem clar que és una dada introduïda per l'usuari, no verificada. */
export default function ManualEntrySheet({ title, sub, initial, submitLabel = 'Desar', closeOnSubmit = true, onSubmit }: Props) {
  const { closeSheet } = useApp();
  const [name, setName] = useState(initial?.name ?? '');
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '');
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '');
  const [note, setNote] = useState(initial?.note ?? '');

  const kcalN = Number(kcal);
  const protN = Number(protein);
  const valid = Number.isFinite(kcalN) && kcalN > 0 && Number.isFinite(protN) && protN >= 0 && protein !== '';

  const save = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim() || undefined,
      kcal: Math.round(kcalN),
      protein: Math.round(protN),
      note: note.trim() || undefined,
    });
    if (closeOnSubmit) closeSheet();
  };

  return (
    <div>
      <SheetHeader title={title} sub={sub} />

      <label className="block mt-3 text-[12.5px] font-semibold text-muted">
        Nom <span className="text-faint font-medium">(opcional)</span>
      </label>
      <input
        className={`${inputCls} mt-1`}
        placeholder="Ex: menú del restaurant"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Calories *</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="kcal"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Proteïna *</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="g"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
        </div>
      </div>

      <label className="block mt-3 text-[12.5px] font-semibold text-muted">
        Nota <span className="text-faint font-medium">(opcional)</span>
      </label>
      <input
        className={`${inputCls} mt-1`}
        placeholder="Ex: amb pa i postres"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="mt-3 flex items-start gap-2 text-[12px] text-muted bg-info-soft rounded-xl px-3.5 py-2.5">
        <Icon name="info" size={15} className="text-info shrink-0 mt-0.5" />
        <span>Dada manual: la introdueixes tu i no és verificada. No en calculem macros.</span>
      </div>

      <Button variant="primary" className="w-full mt-4" icon="check" disabled={!valid} onClick={save}>
        {submitLabel}
      </Button>
    </div>
  );
}
