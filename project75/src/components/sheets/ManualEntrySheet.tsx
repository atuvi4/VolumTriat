import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import { searchFoodPro, type ProFoodItem } from '../../nutrition/apiAdapters/foodProAdapter';
import { CONFIDENCE_LABEL } from '../../nutrition/nutritionSources';
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
  const { state, closeSheet } = useApp();
  const [name, setName] = useState(initial?.name ?? '');
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '');
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '');
  const [note, setNote] = useState(initial?.note ?? '');

  // Catàleg personal: el que sols registrar a mà, per omplir amb un toc.
  const habituals = [...(state.personalItems ?? [])]
    .sort((a, b) => b.count - a.count || (a.lastUsedAt < b.lastUsedAt ? 1 : -1))
    .slice(0, 6);

  // Cerca de productes reals (Open Food Facts / USDA) via /api/food/search.
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProFoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [picked, setPicked] = useState<ProFoodItem | null>(null);
  const [grams, setGrams] = useState('100');
  const [store, setStore] = useState<string>('all');

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    const items = store === 'all' ? await searchFoodPro(q, 'all') : await searchFoodPro(q, 'off', store);
    setResults(items.filter((i) => i.kcalPer100g > 0).slice(0, 10));
    setSearching(false);
  };

  const applyProduct = (it: ProFoodItem, g: number) => {
    const f = (Number.isFinite(g) ? g : 0) / 100;
    setName(it.brand ? `${it.name} (${it.brand})` : it.name);
    setKcal(String(Math.round(it.kcalPer100g * f)));
    setProtein(String(Math.round(it.proteinPer100g * f)));
  };
  const pick = (it: ProFoodItem) => {
    setPicked(it);
    setResults([]);
    applyProduct(it, Number(grams) || 100);
  };
  const onGrams = (v: string) => {
    setGrams(v);
    if (picked) applyProduct(picked, Number(v) || 0);
  };

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

      {habituals.length > 0 && (
        <div className="mt-3">
          <div className="text-[12px] font-semibold text-muted mb-1.5">El que sols menjar</div>
          <div className="flex flex-wrap gap-2">
            {habituals.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  setName(it.name);
                  setKcal(String(it.kcal));
                  setProtein(String(it.protein));
                }}
                className="text-[12.5px] font-semibold bg-surface2 border border-line2 rounded-full px-3 py-1.5 hover:border-accent"
              >
                {it.name} <span className="text-faint">· {it.kcal} kcal · {it.protein}g</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cerca de productes reals (Open Food Facts) */}
      <div className="mt-3">
        <div className="text-[12px] font-semibold text-muted mb-1.5">Cerca un producte real</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[
            { v: 'all', label: 'Tots' },
            { v: 'mercadona', label: 'Mercadona' },
            { v: 'carrefour', label: 'Carrefour' },
            { v: 'lidl', label: 'Lidl' },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => setStore(s.v)}
              className={`text-[12px] font-semibold rounded-full px-3 py-1.5 border ${
                store === s.v ? 'bg-accent text-white border-accent' : 'bg-surface2 text-muted border-line2'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Ex: iogurt proteïnes, pa de motlle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
              }
            }}
          />
          <Button variant="ghost" size="sm" icon="database" disabled={searching || !query.trim()} onClick={runSearch}>
            {searching ? '…' : 'Cercar'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-2 border border-line rounded-[12px] divide-y divide-line max-h-[34vh] overflow-y-auto">
            {results.map((it) => (
              <button
                key={it.externalId}
                onClick={() => pick(it)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-surface2"
              >
                <div className="text-[13.5px] font-semibold">
                  {it.name} {it.brand && <span className="text-faint font-medium">· {it.brand}</span>}
                </div>
                <div className="text-[11.5px] text-muted">
                  {Math.round(it.kcalPer100g)} kcal · {Math.round(it.proteinPer100g)} g prot /100 g · confiança{' '}
                  {CONFIDENCE_LABEL[it.confidence]}
                </div>
              </button>
            ))}
          </div>
        )}
        {searched && !searching && results.length === 0 && (
          <p className="text-[12.5px] text-muted mt-2 mb-0">Cap resultat. Prova un altre terme o omple les dades a mà.</p>
        )}

        {picked && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-muted">Grams:</span>
            <input
              className="w-[110px] bg-surface2 border border-line2 rounded-[10px] px-3 py-2 text-[14px] font-semibold focus:outline-none focus:border-accent"
              type="number"
              inputMode="numeric"
              min={0}
              value={grams}
              onChange={(e) => onGrams(e.target.value)}
            />
            <span className="text-[11.5px] text-faint">macros escalades sota</span>
          </div>
        )}
      </div>

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
        <span>
          Dada teva o d'un producte d'Open Food Facts (pot variar segons marca/etiqueta). Ajusta els grams i confirma
          els números.
        </span>
      </div>

      <Button variant="primary" className="w-full mt-4" icon="check" disabled={!valid} onClick={save}>
        {submitLabel}
      </Button>
    </div>
  );
}
