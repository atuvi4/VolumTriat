import { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Icon from '../Icon';
import { nf } from '../../utils/format';
import { goalsFor, doneKcal, doneProt } from '../../utils/goals';
import { CONFIDENCE_LABEL } from '../../nutrition/nutritionSources';
import {
  generatePurchaseOptionsAI,
  purchaseOptionToSnapshot,
  type PurchaseOption,
  type PurchaseStore,
} from '../../nutrition/mealPurchaseAI';
import { eatenThemesToday } from '../../nutrition/dailyVariety';
import type { ManualLog, ResolvedMeal } from '../../nutrition/nutritionTypes';

interface Props {
  meal: ResolvedMeal;
  /** Registre manual d'«ja ho he menjat» (acció secundària): usa changeMeal i
   *  dispara la lògica d'ajustos relacionats. Ja està protegit en mode visita. */
  onChange: (data: ManualLog) => void;
}

/** IA de compra per àpat: proposa 2-4 cistelles de supermercat que cobreixen
 *  l'àpat pendent. Substituir la proposta el manté PENDENT (no suma fins «Fet»). */
export default function MealPurchaseSheet({ meal, onChange }: Props) {
  const { state, isReadOnly, showToast, replaceMealWithPurchaseOption, closeSheet } = useApp();
  const [store, setStore] = useState<PurchaseStore>('mercadona');
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<PurchaseOption[]>([]);

  const g = goalsFor(state);
  const targetKcal = meal.nutrition.kcal;
  const targetProtein = meal.nutrition.protein;
  const lowApp = state.dayMode === 'pocaGana' || state.checkin?.appetite === 'poca';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    generatePurchaseOptionsAI({
      meal,
      slot: meal.slot,
      targetKcal,
      targetProtein,
      currentDayKcal: doneKcal(state.meals),
      currentDayProtein: doneProt(state.meals),
      targetDayKcal: g.kcal,
      targetDayProtein: g.prot,
      store,
      context: lowApp ? 'low_appetite' : 'no_cook',
      dayMode: state.dayMode,
      appetite: state.checkin?.appetite,
      dislikes: state.dislikes,
      recentMeals: state.meals.filter((m) => !m.isExtra).map((m) => m.name),
      eatenThemes: [...eatenThemesToday(state.meals)],
      outcomes: state.outcomes ?? [],
      maxOptions: 4,
    })
      .then((opts) => alive && setOptions(opts))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Acció principal: substituir la proposta. L'àpat queda PENDENT (no suma).
  const substitute = (o: PurchaseOption) => {
    if (isReadOnly) {
      showToast('Mode visita: substituir la proposta està bloquejat.');
      return;
    }
    replaceMealWithPurchaseOption(meal.id, purchaseOptionToSnapshot(o));
    closeSheet();
  };

  // Acció secundària: ja ho he menjat → registre manual «Canviat» (sí que suma).
  const registerEaten = (o: PurchaseOption) => {
    if (isReadOnly) {
      showToast('Mode visita: registrar la compra està bloquejat.');
      return;
    }
    onChange({
      name: o.title,
      kcal: o.estimatedKcal,
      protein: o.estimatedProtein,
      note: `${o.reason} · Compra IA · ${o.store === 'mercadona' ? 'Mercadona' : 'Supermercat'}`,
    });
  };

  return (
    <div>
      <SheetHeader
        title={`Comprar ${meal.slot}`}
        sub={`Objectiu aprox: ${nf(targetKcal)} kcal · ${targetProtein} g proteïna`}
      />

      {/* Context + selector de botiga */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <Icon name="store" size={14} />
          {lowApp ? 'Context: poca gana · sense cuinar' : 'Context: supermercat · sense cuinar'}
        </span>
        <span className="inline-flex bg-surface2 rounded-[10px] p-[3px]">
          {(['mercadona', 'generic'] as PurchaseStore[]).map((s) => (
            <button
              key={s}
              onClick={() => setStore(s)}
              className={`px-3 py-1.5 rounded-[8px] font-semibold text-[12px] ${
                store === s ? 'bg-surface shadow-card text-ink' : 'text-muted'
              }`}
            >
              {s === 'mercadona' ? 'Mercadona' : 'Genèric'}
            </button>
          ))}
        </span>
      </div>

      {loading ? (
        <div className="text-[13.5px] text-muted py-6 text-center">Generant opcions de compra…</div>
      ) : options.length === 0 ? (
        <p className="text-[13.5px] text-muted mt-2 mb-0">
          Ara mateix no puc proposar compra per aquest àpat.
        </p>
      ) : (
        <div className="mt-1 space-y-2.5 max-h-[62vh] overflow-y-auto pr-0.5">
          {options.map((o) => (
            <div key={o.id} className="border border-line rounded-[14px] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-[14.5px]">{o.title}</div>
                <div className="text-[12.5px] font-semibold text-muted shrink-0">
                  {o.estimatedKcal} kcal · {o.estimatedProtein}g
                </div>
              </div>

              {/* Llista concreta de compra amb quantitats */}
              <ul className="mt-2 space-y-1">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <Icon name="check" size={14} className="text-accent mt-0.5 shrink-0" />
                    <span className="text-ink">
                      {it.name} <span className="text-faint">· {it.qtyLabel}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-[12.5px] text-muted mt-2 mb-0">{o.reason}</p>
              {o.completionHint && (
                <p className="text-[12px] font-semibold text-accent-strong mt-1 mb-0">
                  Per completar: {o.completionHint}
                </p>
              )}
              {o.confidence === 'low' && o.estimatedProtein >= 15 && (
                <p className="flex items-start gap-1 text-[11.5px] font-semibold text-warn mt-1.5 mb-0">
                  <Icon name="alert" size={13} className="shrink-0 mt-0.5" />
                  Estimació baixa: confirma l'etiqueta si comptes amb aquesta proteïna.
                </p>
              )}

              {/* Font + confiança (honestedat de dades) */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2 py-0.5">
                  <Icon name="database" size={11} /> {o.sourceSummary}
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2 py-0.5">
                  <Icon name="info" size={11} /> confiança {CONFIDENCE_LABEL[o.confidence]}
                </span>
              </div>

              <button
                onClick={() => substitute(o)}
                disabled={isReadOnly}
                className="w-full mt-3 inline-flex items-center justify-center gap-1.5 bg-accent text-white font-semibold text-[13px] px-4 py-2.5 rounded-[10px] hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="swap" size={15} /> Substituir {meal.slot}
              </button>
              <p className="text-[11px] text-faint text-center mt-1.5 mb-0">
                Encara no suma calories. Marca «Fet» quan t'ho mengis.
              </p>
              <button
                onClick={() => registerEaten(o)}
                disabled={isReadOnly}
                className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 text-muted font-semibold text-[12.5px] px-4 py-2 rounded-[10px] hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="check" size={14} /> Ja ho he menjat · registrar com canviat
              </button>
            </div>
          ))}

          <p className="text-[11.5px] text-faint mt-1 mb-0">
            Estimació de compra ràpida: macros per 100 g reals escalades a la ració. En desplegar
            les APIs, els productes s'enriqueixen amb dades de súper. No és consell nutricional.
          </p>
        </div>
      )}
    </div>
  );
}
