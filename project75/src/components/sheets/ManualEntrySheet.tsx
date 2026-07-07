import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import { searchFoodPro, type ProFoodItem } from '../../nutrition/apiAdapters/foodProAdapter';
import { CONFIDENCE_LABEL } from '../../nutrition/nutritionSources';
import { FOODS, getFood } from '../../nutrition/foodDatabase';
import { goalsFor, doneKcal, doneProt } from '../../utils/goals';
import type { ManualLog } from '../../nutrition/nutritionTypes';

const stripAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

interface Props {
  title: string;
  sub: string;
  initial?: ManualLog;
  submitLabel?: string;
  /** Si és false, no tanca el sheet en desar (el callback decideix què fer després). */
  closeOnSubmit?: boolean;
  /** Objectiu de l'àpat (kcal/proteïna) per al recomanador de grams. Si falta,
   *  s'usa el que queda del dia. */
  target?: { kcal: number; protein: number };
  onSubmit: (data: ManualLog) => void;
}

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[15px] font-semibold focus:outline-none focus:border-accent';

/** Formulari manual reutilitzat per «Àpat canviat» i «Extra».
 *  Calories i proteïna són obligatòries; nom i nota, opcionals.
 *  Deixem clar que és una dada introduïda per l'usuari, no verificada. */
export default function ManualEntrySheet({ title, sub, initial, submitLabel = 'Desar', closeOnSubmit = true, target, onSubmit }: Props) {
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
    const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const clean = items
      .filter((i) => i.kcalPer100g > 0)
      .sort((a, b) => (rank[a.confidence] ?? 3) - (rank[b.confidence] ?? 3)); // millors dades primer
    setResults(clean.slice(0, 25));
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

  // Compositor per ingredients (base local): p. ex. pollastre 150 g + patata 300 g.
  const [ingredients, setIngredients] = useState<{ foodId: string; grams: number }[]>([]);
  const [ingQuery, setIngQuery] = useState('');
  const foodMatches =
    stripAccents(ingQuery).length >= 2
      ? FOODS.filter((f) => stripAccents(f.name).includes(stripAccents(ingQuery))).slice(0, 8)
      : [];

  const syncFromIngredients = (list: { foodId: string; grams: number }[]) => {
    let kc = 0;
    let pr = 0;
    for (const ing of list) {
      const food = getFood(ing.foodId);
      if (!food) continue;
      const f = ing.grams / 100;
      kc += food.kcalPer100g * f;
      pr += food.proteinPer100g * f;
    }
    setKcal(String(Math.round(kc)));
    setProtein(String(Math.round(pr)));
    if (list.length) setName(list.map((i) => getFood(i.foodId)?.name ?? '').filter(Boolean).join(' + '));
  };
  const addIngredient = (foodId: string) => {
    const food = getFood(foodId);
    const grams = food?.portions?.normal ?? 100;
    const next = [...ingredients, { foodId, grams }];
    setIngredients(next);
    setIngQuery('');
    syncFromIngredients(next);
  };
  const setIngGrams = (idx: number, v: string) => {
    const g = Math.max(0, Number(v) || 0);
    const next = ingredients.map((it, i) => (i === idx ? { ...it, grams: g } : it));
    setIngredients(next);
    syncFromIngredients(next);
  };
  const removeIngredient = (idx: number) => {
    const next = ingredients.filter((_, i) => i !== idx);
    setIngredients(next);
    syncFromIngredients(next);
  };

  // Objectiu per al recomanador: el de l'àpat (si el rebem) o el que queda del dia.
  const g = goalsFor(state);
  const effectiveTarget = target ?? {
    kcal: Math.max(250, g.kcal - doneKcal(state.meals)),
    protein: Math.max(20, g.prot - doneProt(state.meals)),
  };

  /** Recomana grams de cada ingredient per acostar-se a l'objectiu de l'àpat:
   *  les proteïnes cobreixen la proteïna; la resta omple les kcal restants. */
  const recommendGrams = () => {
    if (!ingredients.length) return;
    const infos = ingredients.map((ing) => getFood(ing.foodId));
    const isProt = (i: number) => {
      const f = infos[i];
      return !!f && (f.category === 'protein' || f.category === 'legume');
    };
    const protIdx = ingredients.map((_, i) => i).filter(isProt);
    const enerIdx = ingredients.map((_, i) => i).filter((i) => infos[i] && !isProt(i));
    const grams = ingredients.map(() => 0);

    let protKcal = 0;
    if (protIdx.length) {
      const perProt = effectiveTarget.protein / protIdx.length;
      for (const i of protIdx) {
        const f = infos[i]!;
        const gg = f.proteinPer100g > 0 ? (perProt / f.proteinPer100g) * 100 : 0;
        grams[i] = gg;
        protKcal += (f.kcalPer100g * gg) / 100;
      }
    }
    const remKcal = Math.max(0, effectiveTarget.kcal - protKcal);
    if (enerIdx.length) {
      const perKcal = remKcal / enerIdx.length;
      for (const i of enerIdx) {
        const f = infos[i]!;
        grams[i] = f.kcalPer100g > 0 ? (perKcal / f.kcalPer100g) * 100 : 0;
      }
    } else if (protIdx.length && protKcal > 0 && protKcal < effectiveTarget.kcal) {
      const scale = effectiveTarget.kcal / protKcal;
      for (const i of protIdx) grams[i] *= scale;
    }

    const next = ingredients.map((ing, i) => ({ foodId: ing.foodId, grams: Math.max(0, Math.round(grams[i] / 5) * 5) }));
    setIngredients(next);
    syncFromIngredients(next);
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

      {/* Compon un àpat per ingredients (base local) */}
      <div className="mt-3 border-t border-line pt-3">
        <div className="text-[12px] font-semibold text-muted mb-1.5">Compon per ingredients (calcula sol)</div>
        <input
          className={inputCls}
          placeholder="Afegeix un ingredient: pollastre, patata, arròs…"
          value={ingQuery}
          onChange={(e) => setIngQuery(e.target.value)}
        />
        {foodMatches.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {foodMatches.map((f) => (
              <button
                key={f.id}
                onClick={() => addIngredient(f.id)}
                className="text-[12.5px] font-semibold bg-surface2 border border-line2 rounded-full px-3 py-1.5 hover:border-accent"
              >
                + {f.name}
              </button>
            ))}
          </div>
        )}

        {ingredients.length > 0 && (
          <button
            onClick={recommendGrams}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent border border-accent-line bg-accent-soft rounded-[10px] py-2"
          >
            <Icon name="target" size={15} /> Recomana'm els grams (~{Math.round(effectiveTarget.kcal)} kcal ·{' '}
            {Math.round(effectiveTarget.protein)} g)
          </button>
        )}

        {ingredients.length > 0 && (
          <div className="mt-2 border border-line rounded-[12px] divide-y divide-line">
            {ingredients.map((ing, idx) => {
              const food = getFood(ing.foodId);
              if (!food) return null;
              const f = ing.grams / 100;
              return (
                <div key={idx} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{food.name}</div>
                    <div className="text-[11px] text-faint">
                      {Math.round(food.kcalPer100g * f)} kcal · {Math.round(food.proteinPer100g * f)} g P
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
                  <span className="text-[11px] text-faint">g</span>
                  <button onClick={() => removeIngredient(idx)} className="text-faint hover:text-warn p-1">
                    <Icon name="x" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {ingredients.length > 0 && (
          <p className="text-[11.5px] text-faint mt-1.5 mb-0">
            Total calculat des dels ingredients (base local). Ajusta els grams i ja tens les kcal i la proteïna a sota.
          </p>
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
