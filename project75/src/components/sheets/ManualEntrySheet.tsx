import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import { searchFoodPro, type ProFoodItem } from '../../nutrition/apiAdapters/foodProAdapter';
import { CONFIDENCE_LABEL } from '../../nutrition/nutritionSources';
import { FOODS, getFood } from '../../nutrition/foodDatabase';
import { goalsFor, doneKcal, doneProt } from '../../utils/goals';
import { sumIngredients } from '../../nutrition/mealCalc';
import type { ManualLog } from '../../nutrition/nutritionTypes';

const stripAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

interface Props {
  title: string;
  sub: string;
  initial?: ManualLog;
  submitLabel?: string;
  closeOnSubmit?: boolean;
  /** Objectiu de l'àpat (kcal/proteïna) per al recomanador de grams. */
  target?: { kcal: number; protein: number };
  /** Mostra l'interruptor «Ja ho he menjat» (per canviar un àpat sense marcar-lo fet). */
  allowPending?: boolean;
  /** Estat inicial de l'interruptor «Ja ho he menjat» (per defecte: sí si hi ha `initial`). */
  defaultEaten?: boolean;
  onSubmit: (data: ManualLog) => void;
}

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[15px] font-semibold focus:outline-none focus:border-accent';

/** Ingredient del compositor: guarda les seves macros per 100 g (local o OFF). */
interface CompIngredient {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  category?: string;
  grams: number;
  /** 'ml' per a líquids (mostra); el càlcul segueix per 100 g≈100 ml. */
  unit?: 'g' | 'ml';
}

export default function ManualEntrySheet({ title, sub, initial, submitLabel = 'Desar', closeOnSubmit = true, target, allowPending, defaultEaten, onSubmit }: Props) {
  const { state, closeSheet, savePersonalIngredient } = useApp();
  const [name, setName] = useState(initial?.name ?? '');
  const [kcal, setKcal] = useState(initial ? String(initial.kcal) : '');
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [asShake, setAsShake] = useState(false);
  // Editar un àpat ja registrat (té initial) → per defecte segueix menjat; canviar
  // un àpat de zero → per defecte PENDENT (no el marca fet fins que ho confirmis).
  const [asEaten, setAsEaten] = useState(allowPending ? (defaultEaten ?? !!initial) : true);

  const kcalN = Number(kcal);
  const protN = Number(protein);
  const valid = Number.isFinite(kcalN) && kcalN > 0 && Number.isFinite(protN) && protN >= 0 && protein !== '';

  // Catàleg personal: el que sols registrar a mà, per omplir amb un toc.
  const habituals = [...(state.personalItems ?? [])]
    .sort((a, b) => b.count - a.count || (a.lastUsedAt < b.lastUsedAt ? 1 : -1))
    .slice(0, 6);

  // ---------- Compositor per ingredients (local + Open Food Facts) ----------
  const [ingredients, setIngredients] = useState<CompIngredient[]>([]);

  const fin = (n: number) => (Number.isFinite(n) ? n : 0);
  const syncFromIngredients = (list: CompIngredient[]) => {
    const t = sumIngredients(list); // càlcul fiable i testejat
    setKcal(String(t.kcal));
    setProtein(String(t.protein));
    if (list.length) setName(list.map((i) => i.name).join(' + '));
  };
  const compTotal = sumIngredients(ingredients);
  const addIngredient = (ci: CompIngredient) => {
    const next = [...ingredients, ci];
    setIngredients(next);
    syncFromIngredients(next);
  };
  const setIngGrams = (idx: number, v: string) => {
    const grams = Math.max(0, Number(v) || 0);
    const next = ingredients.map((it, i) => (i === idx ? { ...it, grams } : it));
    setIngredients(next);
    syncFromIngredients(next);
  };
  const removeIngredient = (idx: number) => {
    const next = ingredients.filter((_, i) => i !== idx);
    setIngredients(next);
    syncFromIngredients(next);
  };

  // Cerca a la base local (instantani).
  const [localQ, setLocalQ] = useState('');
  const localMatches =
    stripAccents(localQ).length >= 2
      ? FOODS.filter((f) => stripAccents(f.name).includes(stripAccents(localQ))).slice(0, 8)
      : [];
  const addLocal = (foodId: string) => {
    const f = getFood(foodId);
    if (!f) return;
    addIngredient({
      name: f.name,
      kcalPer100g: f.kcalPer100g,
      proteinPer100g: f.proteinPer100g,
      category: f.category,
      grams: f.portions?.normal ?? 100,
      unit: f.displayUnit,
    });
    setLocalQ('');
  };

  // Ingredients propis (p. ex. la teva proteïna de marca) + formulari per crear-ne.
  const personalIngs = state.personalIngredients ?? [];
  const [cName, setCName] = useState('');
  const [cKcal, setCKcal] = useState('');
  const [cProt, setCProt] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const cValid = cName.trim().length >= 2 && Number(cKcal) > 0 && Number(cProt) >= 0 && cProt !== '';
  const addPersonalIng = (name: string, kcalPer100g: number, proteinPer100g: number) =>
    addIngredient({ name, kcalPer100g, proteinPer100g, category: proteinPer100g >= 15 ? 'protein' : undefined, grams: 30 });
  const saveAndAddCustom = () => {
    if (!cValid) return;
    const k = Math.round(Number(cKcal));
    const p = Math.round(Number(cProt) * 10) / 10;
    savePersonalIngredient(cName.trim(), k, p);
    addPersonalIng(cName.trim(), k, p);
    setCName('');
    setCKcal('');
    setCProt('');
    setShowCustom(false);
  };

  // Cerca a Open Food Facts (productes reals, filtrable per súper).
  const [offQ, setOffQ] = useState('');
  const [offResults, setOffResults] = useState<ProFoodItem[]>([]);
  const [offSearching, setOffSearching] = useState(false);
  const [offSearched, setOffSearched] = useState(false);
  const [store, setStore] = useState<string>('all');
  const runOffSearch = async () => {
    const q = offQ.trim();
    if (!q) return;
    setOffSearching(true);
    setOffSearched(true);
    const items = store === 'all' ? await searchFoodPro(q, 'all') : await searchFoodPro(q, 'off', store);
    const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    setOffResults(
      items.filter((i) => i.kcalPer100g > 0).sort((a, b) => (rank[a.confidence] ?? 3) - (rank[b.confidence] ?? 3)).slice(0, 25),
    );
    setOffSearching(false);
  };
  const addOff = (it: ProFoodItem) => {
    addIngredient({
      name: it.brand ? `${it.name} (${it.brand})` : it.name,
      kcalPer100g: it.kcalPer100g,
      proteinPer100g: it.proteinPer100g,
      grams: 100,
    });
    setOffResults([]);
    setOffQ('');
  };

  // Objectiu per al recomanador: el de l'àpat (si el rebem) o el que queda del dia.
  const gday = goalsFor(state);
  const effectiveTarget = target ?? {
    kcal: Math.max(250, gday.kcal - doneKcal(state.meals)),
    protein: Math.max(20, gday.prot - doneProt(state.meals)),
  };

  /** Recomana grams: les proteïnes cobreixen la proteïna; la resta omple les kcal. */
  const recommendGrams = () => {
    if (!ingredients.length) return;
    const isProt = (ci: CompIngredient) =>
      ci.category ? ci.category === 'protein' || ci.category === 'legume' : ci.proteinPer100g >= 15;
    const protIdx = ingredients.map((_, i) => i).filter((i) => isProt(ingredients[i]));
    const enerIdx = ingredients.map((_, i) => i).filter((i) => !isProt(ingredients[i]));
    const grams = ingredients.map(() => 0);

    let protKcal = 0;
    if (protIdx.length) {
      const perProt = effectiveTarget.protein / protIdx.length;
      for (const i of protIdx) {
        const ci = ingredients[i];
        const gg = ci.proteinPer100g > 0 ? (perProt / ci.proteinPer100g) * 100 : 0;
        grams[i] = gg;
        protKcal += (ci.kcalPer100g * gg) / 100;
      }
    }
    const remKcal = Math.max(0, effectiveTarget.kcal - protKcal);
    if (enerIdx.length) {
      const perKcal = remKcal / enerIdx.length;
      for (const i of enerIdx) {
        const ci = ingredients[i];
        grams[i] = ci.kcalPer100g > 0 ? (perKcal / ci.kcalPer100g) * 100 : 0;
      }
    } else if (protIdx.length && protKcal > 0 && protKcal < effectiveTarget.kcal) {
      const scale = effectiveTarget.kcal / protKcal;
      for (const i of protIdx) grams[i] *= scale;
    }

    const next = ingredients.map((ci, i) => ({
      ...ci,
      grams: Math.min(800, Math.max(0, Math.round(fin(grams[i]) / 5) * 5)), // mai absurd
    }));
    setIngredients(next);
    syncFromIngredients(next);
  };

  const save = () => {
    if (!valid) return;
    // Els grams del compositor es conserven a la NOTA: sense això, després
    // només queden kcal/proteïna i no recordes quant hi vas posar.
    const gramsDetail = ingredients
      .filter((i) => i.grams > 0)
      .map((i) => `${i.grams} ${i.unit ?? 'g'} ${i.name.toLowerCase()}`)
      .join(' + ');
    onSubmit({
      name: name.trim() || undefined,
      kcal: Math.round(kcalN),
      protein: Math.round(protN),
      note: [note.trim(), gramsDetail].filter(Boolean).join(' · ') || undefined,
      isShake: asShake || undefined,
      eaten: allowPending ? asEaten : undefined,
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

      {/* Compon un àpat per ingredients */}
      <div className="mt-3 border-t border-line pt-3">
        <div className="text-[12px] font-semibold text-muted mb-1.5">Compon per ingredients (calcula sol)</div>
        <input
          className={inputCls}
          placeholder="Ingredient bàsic: pollastre, patata, arròs, patates fregides…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
        />
        {localMatches.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {localMatches.map((f) => (
              <button
                key={f.id}
                onClick={() => addLocal(f.id)}
                className="text-[12.5px] font-semibold bg-surface2 border border-line2 rounded-full px-3 py-1.5 hover:border-accent"
              >
                + {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Els meus ingredients (macros pròpies, p. ex. la teva proteïna) */}
        {personalIngs.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {personalIngs.map((it) => (
              <button
                key={it.id}
                onClick={() => addPersonalIng(it.name, it.kcalPer100g, it.proteinPer100g)}
                className="text-[12.5px] font-semibold bg-accent-soft text-accent-strong border border-accent-line rounded-full px-3 py-1.5"
              >
                + {it.name}
              </button>
            ))}
          </div>
        )}
        {!showCustom ? (
          <button onClick={() => setShowCustom(true)} className="mt-1.5 text-[12.5px] font-semibold text-accent">
            + Ingredient propi (de l'etiqueta)
          </button>
        ) : (
          <div className="mt-2 border border-line rounded-[12px] p-3 space-y-2">
            <div className="text-[12px] font-semibold text-muted">Ingredient propi · macros per 100 g</div>
            <input className={inputCls} placeholder="Nom (ex: Proteïna LifePro)" value={cName} onChange={(e) => setCName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                type="number"
                inputMode="numeric"
                placeholder="kcal /100 g"
                value={cKcal}
                onChange={(e) => setCKcal(e.target.value)}
              />
              <input
                className={inputCls}
                type="number"
                inputMode="numeric"
                placeholder="prot /100 g"
                value={cProt}
                onChange={(e) => setCProt(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon="check" disabled={!cValid} onClick={saveAndAddCustom}>
                Afegir i desar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}>
                Cancel·lar
              </Button>
            </div>
            <p className="text-[11px] text-faint m-0">Ho trobaràs a l'etiqueta (per 100 g). Es desa per reutilitzar-lo.</p>
          </div>
        )}

        {/* Cerca un producte real (Open Food Facts) i afegeix-lo com a ingredient */}
        <div className="mt-2.5">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
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
              placeholder="…o cerca un producte real (Open Food Facts)"
              value={offQ}
              onChange={(e) => setOffQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runOffSearch();
                }
              }}
            />
            <Button variant="ghost" size="sm" icon="database" disabled={offSearching || !offQ.trim()} onClick={runOffSearch}>
              {offSearching ? '…' : 'Cercar'}
            </Button>
          </div>
          {offResults.length > 0 && (
            <div className="mt-2 border border-line rounded-[12px] divide-y divide-line max-h-[32vh] overflow-y-auto">
              {offResults.map((it) => (
                <button key={it.externalId} onClick={() => addOff(it)} className="w-full text-left px-3.5 py-2.5 hover:bg-surface2">
                  <div className="text-[13.5px] font-semibold">
                    + {it.name} {it.brand && <span className="text-faint font-medium">· {it.brand}</span>}
                  </div>
                  <div className="text-[11.5px] text-muted">
                    {Math.round(it.kcalPer100g)} kcal · {Math.round(it.proteinPer100g)} g prot /100 g · confiança{' '}
                    {CONFIDENCE_LABEL[it.confidence]}
                  </div>
                </button>
              ))}
            </div>
          )}
          {offSearched && !offSearching && offResults.length === 0 && (
            <p className="text-[12.5px] text-muted mt-2 mb-0">Cap resultat. Prova un altre terme o afegeix-ho de la base local.</p>
          )}
        </div>

        {ingredients.length > 0 && (
          <button
            onClick={recommendGrams}
            className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent border border-accent-line bg-accent-soft rounded-[10px] py-2"
          >
            <Icon name="target" size={15} /> Recomana'm els grams (~{Math.round(effectiveTarget.kcal)} kcal ·{' '}
            {Math.round(effectiveTarget.protein)} g)
          </button>
        )}

        {ingredients.length > 0 && (
          <div className="mt-2 border border-line rounded-[12px] divide-y divide-line">
            {ingredients.map((ing, idx) => {
              const f = ing.grams / 100;
              return (
                <div key={idx} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{ing.name}</div>
                    <div className="text-[11px] text-faint">
                      {Math.round(ing.kcalPer100g * f)} kcal · {Math.round(ing.proteinPer100g * f)} g P
                    </div>
                  </div>
                  <input
                    className="w-[78px] bg-surface2 border border-line2 rounded-[10px] px-2.5 py-1.5 text-[13px] font-semibold text-right focus:outline-none focus:border-accent"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={ing.grams}
                    onChange={(e) => setIngGrams(idx, e.target.value)}
                  />
                  <span className="text-[11px] text-faint">{ing.unit ?? 'g'}</span>
                  <button onClick={() => removeIngredient(idx)} className="text-faint hover:text-warn p-1">
                    <Icon name="x" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-2 flex items-center justify-between bg-surface2 border border-line rounded-[10px] px-3.5 py-2">
            <span className="text-[12.5px] font-bold text-muted">Total calculat</span>
            <span className="text-[14px] font-extrabold">
              {compTotal.kcal} kcal · {compTotal.protein} g P
            </span>
          </div>
        )}
      </div>

      <label className="block mt-3 text-[12.5px] font-semibold text-muted">
        Nom <span className="text-faint font-medium">(opcional)</span>
      </label>
      <input className={`${inputCls} mt-1`} placeholder="Ex: menú del restaurant" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Calories *</label>
          <input
            className={`${inputCls} mt-1`}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="kcal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Proteïna *</label>
          <input
            className={`${inputCls} mt-1`}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="g"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
          />
        </div>
      </div>

      <label className="block mt-3 text-[12.5px] font-semibold text-muted">
        Nota <span className="text-faint font-medium">(opcional)</span>
      </label>
      <input className={`${inputCls} mt-1`} placeholder="Ex: amb pa i postres" value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="mt-3 flex items-start gap-2 text-[12px] text-muted bg-info-soft rounded-xl px-3.5 py-2.5">
        <Icon name="info" size={15} className="text-info shrink-0 mt-0.5" />
        <span>Dada teva, de la base local o d'Open Food Facts (pot variar segons marca/etiqueta). Confirma els números.</span>
      </div>

      {allowPending && (
        <button
          type="button"
          onClick={() => setAsEaten((v) => !v)}
          className="mt-3 w-full flex items-center justify-between border border-line rounded-xl px-3.5 py-2.5"
        >
          <span className="text-[13px] font-semibold flex items-center gap-1.5">
            <Icon name="check" size={16} className="text-muted" /> Ja ho he menjat
            <span className="text-[11px] text-faint font-medium">{asEaten ? '(compta ara)' : '(queda pendent)'}</span>
          </span>
          <span className={`w-9 h-5 rounded-full relative transition-colors ${asEaten ? 'bg-accent' : 'bg-line2'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${asEaten ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setAsShake((v) => !v)}
        className="mt-3 w-full flex items-center justify-between border border-line rounded-xl px-3.5 py-2.5"
      >
        <span className="text-[13px] font-semibold flex items-center gap-1.5">
          <Icon name="cup" size={16} className="text-muted" /> Compta com a batut
        </span>
        <span className={`w-9 h-5 rounded-full relative transition-colors ${asShake ? 'bg-accent' : 'bg-line2'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${asShake ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
      </button>

      <Button variant="primary" className="w-full mt-3" icon="check" disabled={!valid} onClick={save}>
        {submitLabel}
      </Button>
    </div>
  );
}
