import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import type { ManualLog, ResolvedMeal } from '../../nutrition/nutritionTypes';

interface Props {
  meal: ResolvedMeal;
  /** Mateix handler que «He menjat una altra cosa»: registra com a canviat
   *  (o corregeix la proposta pendent). Ja està protegit en mode visita. */
  onChange: (data: ManualLog) => void;
}

/** Una línia de producte real (dades de l'etiqueta, per 100 g). */
interface Line {
  name: string;
  grams: string;
  kcal100: string;
  prot100: string;
}

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-xl px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent';

/** Prefill de línies a partir dels ingredients de la proposta (Compra IA).
 *  Deriva kcal/proteïna per 100 g del que ja s'havia estimat, perquè l'usuari
 *  només hagi de corregir els números de l'etiqueta, no calcular-ho tot. */
function prefill(meal: ResolvedMeal): Line[] {
  const lines = meal.ingredients
    .filter((ing) => ing.grams > 0)
    .map((ing) => {
      const per = (v: number) => Math.round((v / ing.grams) * 1000) / 10; // 1 decimal
      return {
        name: ing.name.split(' · ')[0],
        grams: String(ing.grams),
        kcal100: String(Math.round((ing.nutrition.kcal / ing.grams) * 100)),
        prot100: String(per(ing.nutrition.protein)),
      };
    });
  return lines.length ? lines : [{ name: '', grams: '', kcal100: '', prot100: '' }];
}

const num = (s: string) => Number(s);

/**
 * Corregir compra real (V1, sense OCR): l'usuari introdueix els productes que
 * ha comprat de veritat (nom, grams, kcal/100 g, proteïna/100 g) i l'app calcula
 * els totals i el nom de l'àpat. Deixa l'estructura preparada perquè més
 * endavant es pugui omplir per codi de barres / foto d'etiqueta / Open Food Facts.
 */
export default function CorrectPurchaseSheet({ meal, onChange }: Props) {
  const { isReadOnly, showToast } = useApp();
  const [lines, setLines] = useState<Line[]>(() => prefill(meal));

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { name: '', grams: '', kcal100: '', prot100: '' }]);
  const removeLine = (i: number) => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls));

  const lineKcal = (l: Line) => (num(l.grams) > 0 && Number.isFinite(num(l.kcal100)) ? (num(l.grams) / 100) * num(l.kcal100) : 0);
  const lineProt = (l: Line) => (num(l.grams) > 0 && Number.isFinite(num(l.prot100)) ? (num(l.grams) / 100) * num(l.prot100) : 0);

  const valid = lines.filter((l) => num(l.grams) > 0 && l.kcal100 !== '' && Number.isFinite(num(l.kcal100)));
  const totalKcal = Math.round(valid.reduce((n, l) => n + lineKcal(l), 0));
  const totalProt = Math.round(valid.reduce((n, l) => n + lineProt(l), 0));
  const composedName = valid.map((l) => l.name.trim()).filter(Boolean).join(' + ') || meal.name;
  const canSave = valid.length > 0 && totalKcal > 0;

  const save = () => {
    if (isReadOnly) {
      showToast('Mode visita: guardar la correcció està bloquejat.');
      return;
    }
    if (!canSave) return;
    onChange({
      name: composedName,
      kcal: totalKcal,
      protein: totalProt,
      // «etiqueta» marca la dada com a introduïda per l'usuari des de l'etiqueta real.
      note: 'Etiqueta introduïda per tu · compra real',
    });
  };

  return (
    <div>
      <SheetHeader
        title={`Corregir productes · ${meal.slot}`}
        sub="Posa el que has comprat de veritat (dades de l'etiqueta). Jo calculo els totals."
      />

      <div className="mt-2 space-y-2.5 max-h-[52vh] overflow-y-auto pr-0.5">
        {lines.map((l, i) => (
          <div key={i} className="border border-line rounded-[14px] p-3">
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                placeholder="Producte (ex: Iogurt grec maduixa)"
                value={l.name}
                onChange={(e) => setLine(i, { name: e.target.value })}
              />
              {lines.length > 1 && (
                <button onClick={() => removeLine(i)} className="text-muted hover:text-ink shrink-0 p-1" aria-label="Treure">
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <label className="block">
                <span className="text-[11px] font-semibold text-muted">Grams</span>
                <input className={`${inputCls} mt-0.5`} type="number" inputMode="decimal" min={0} placeholder="g"
                  value={l.grams} onChange={(e) => setLine(i, { grams: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-muted">Kcal/100g</span>
                <input className={`${inputCls} mt-0.5`} type="number" inputMode="decimal" min={0} placeholder="kcal"
                  value={l.kcal100} onChange={(e) => setLine(i, { kcal100: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-muted">Prot/100g</span>
                <input className={`${inputCls} mt-0.5`} type="number" inputMode="decimal" min={0} placeholder="g"
                  value={l.prot100} onChange={(e) => setLine(i, { prot100: e.target.value })} />
              </label>
            </div>
            {num(l.grams) > 0 && l.kcal100 !== '' && (
              <div className="mt-1.5 text-[11.5px] font-semibold text-faint">
                = {Math.round(lineKcal(l))} kcal · {Math.round(lineProt(l))} g proteïna
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addLine} className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
        <Icon name="plus" size={15} /> Afegir producte
      </button>

      {/* Total calculat automàticament */}
      <div className="mt-3 flex items-center justify-between bg-accent-soft border border-accent-line rounded-[14px] px-4 py-3">
        <span className="text-[12.5px] font-bold text-accent-strong">Total calculat</span>
        <span className="text-[15px] font-extrabold text-accent-strong">{totalKcal} kcal · {totalProt} g proteïna</span>
      </div>

      <div className="mt-2.5 flex items-start gap-2 text-[12px] text-muted bg-info-soft rounded-xl px-3.5 py-2.5">
        <Icon name="info" size={15} className="text-info shrink-0 mt-0.5" />
        <span>Dada real que introdueixes tu (macros de l'etiqueta). Més endavant es podrà escanejar el codi o la foto de l'etiqueta.</span>
      </div>

      <Button variant="primary" className="w-full mt-3" icon="check" disabled={!canSave || isReadOnly} onClick={save}>
        Guardar com {meal.slot} canviat
      </Button>
    </div>
  );
}
