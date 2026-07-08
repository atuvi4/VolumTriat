import type { ResolvedMeal } from '../nutrition/nutritionTypes';
import { SOURCE_META, precisionSummary } from '../nutrition/nutritionSources';
import { mealStatus, mealEaten } from '../utils/goals';
import {
  sourceLabelForMeal, requiresUserCheck, isSuspiciousPurchaseSnapshot,
} from '../nutrition/nutritionConfidencePolicy';
import { varietySuggestionForMeal } from '../nutrition/dailyVariety';
import Icon from './Icon';

interface Props {
  meal: ResolvedMeal;
  /** Tots els àpats del dia (per detectar repeticions d'aliment base). */
  dayMeals?: ResolvedMeal[];
  onMarkDone: () => void;
  onOpenOptions: () => void;
  onUndo: () => void;
  onEdit: () => void;
  onViewCalc: () => void;
  /** Obrir alternatives (SwapSheet) des de l'avís de varietat. */
  onSwap?: () => void;
}

const STATUS_BADGE: Record<
  Exclude<ReturnType<typeof mealStatus>, 'pending'>,
  { label: string; cls: string; icon: 'check' | 'swap' | 'clock' | 'x' }
> = {
  done: { label: 'Fet', cls: 'text-accent bg-accent-soft', icon: 'check' },
  changed: { label: 'Canviat', cls: 'text-info bg-info-soft', icon: 'swap' },
  partial: { label: 'Parcial', cls: 'text-info bg-info-soft', icon: 'clock' },
  skipped: { label: 'Saltat', cls: 'text-muted bg-surface2', icon: 'x' },
};

export default function MealCard({ meal, dayMeals, onMarkDone, onOpenOptions, onUndo, onEdit, onViewCalc, onSwap }: Props) {
  const status = mealStatus(meal);
  const eaten = mealEaten(meal);
  const pending = status === 'pending';
  const skipped = status === 'skipped';
  // Varietat diària: només per àpats PENDENTS (no toquem els ja menjats/canviats).
  const variety = pending && dayMeals ? varietySuggestionForMeal(meal, dayMeals) : null;
  const badge = status === 'pending' ? null : STATUS_BADGE[status];
  const sources = meal.sources.map((s) => SOURCE_META[s].short).join(' · ');

  // Xifres a mostrar: intake real si compta, si no la recepta planificada.
  const shown = eaten ?? meal.nutrition;

  return (
    <div
      className={`border rounded-2xl p-[15px] mt-[11px] transition-colors ${
        pending ? 'bg-surface border-line' : 'bg-surface2 border-line'
      } ${skipped ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.07em] text-faint font-bold">{meal.slot}</div>
          <div className={`font-bold text-[15.5px] mt-[3px] ${!pending ? 'text-muted' : ''} ${skipped ? 'line-through' : ''}`}>
            {status === 'changed' && meal.logged?.name ? meal.logged.name : meal.name}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {meal.tags.includes('supplement') && (
            <span className="text-[10.5px] font-bold text-info bg-info-soft px-2 py-1 rounded-full">Suplement</span>
          )}
          {badge && (
            <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full ${badge.cls}`}>
              <Icon name={badge.icon} size={12} />
              {badge.label}
              {status === 'partial' && meal.partialPct ? ` ${meal.partialPct}%` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Xifres */}
      {skipped ? (
        <div className="mt-2 text-[13px] font-semibold text-faint">No suma calories ni proteïna avui.</div>
      ) : (
        <div className="flex flex-wrap gap-3 mt-2 text-[13px] font-semibold text-muted">
          <span>{shown.kcal} kcal</span>
          <span>{shown.protein} g proteïna</span>
          {status === 'done' && <span className="text-faint font-medium">{shown.carbs}C · {shown.fat}G</span>}
        </div>
      )}

      {/* Origen de la proposta (només mentre és proposta: pending/done, NO changed manual) */}
      {!skipped && meal.originNote && status !== 'changed' && (
        <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-info">
          <Icon name="store" size={13} /> {meal.originNote} · estimació
        </div>
      )}

      {/* Transparència de dades */}
      {!skipped &&
        (status === 'changed' ? (
          <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-muted">
            <Icon name="edit" size={13} /> {sourceLabelForMeal(meal, status)}
          </div>
        ) : status === 'partial' ? (
          <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-muted">
            <Icon name="info" size={13} /> Estimació proporcional ({meal.partialPct ?? 0}% de la recepta)
          </div>
        ) : (
          <button
            onClick={onViewCalc}
            className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-muted hover:text-accent"
          >
            <Icon name="database" size={13} />
            {precisionSummary(meal.precision, meal.confidence)} · Fonts: {sources}
            <span className="text-accent">· Veure càlcul</span>
          </button>
        ))}

      {/* Avís de seguretat: confiança baixa quan la proteïna importa */}
      {!skipped && requiresUserCheck(meal, status) && (
        <div className="flex items-start gap-1.5 mt-2 text-[11.5px] font-semibold text-warn bg-warn-soft rounded-lg px-2.5 py-1.5">
          <Icon name="alert" size={13} className="shrink-0 mt-0.5" />
          Estimació baixa: revisa l'etiqueta si aquest àpat és important per proteïna.
        </div>
      )}

      {/* Avís: proposta de compra possiblement d'una versió antiga */}
      {!skipped && isSuspiciousPurchaseSnapshot(meal) && (
        <div className="flex items-start gap-1.5 mt-2 text-[11.5px] font-semibold text-warn bg-warn-soft rounded-lg px-2.5 py-1.5">
          <Icon name="alert" size={13} className="shrink-0 mt-0.5" />
          Aquesta proposta pot venir d'una versió antiga. A «Opcions» pots corregir productes o tornar a generar la compra.
        </div>
      )}

      {meal.logged?.note && (
        <div className="mt-1.5 text-[12px] text-faint italic">«{meal.logged.note}»</div>
      )}

      {/* Varietat diària: avís suau si repeteix un aliment base ja menjat avui */}
      {variety && (
        <div className="flex items-start gap-2 mt-2 text-[12px] bg-info-soft text-info rounded-lg px-3 py-2">
          <Icon name="swap" size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{variety.message}</span>
            {onSwap && (
              <button onClick={onSwap} className="ml-1.5 font-bold underline underline-offset-2 hover:text-info/80">
                Canviar opció
              </button>
            )}
          </div>
        </div>
      )}

      {/* Accions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {pending ? (
          <>
            <button
              onClick={onMarkDone}
              className="inline-flex items-center gap-1.5 bg-accent text-white font-semibold text-[13px] px-4 py-2 rounded-[10px] hover:bg-accent-strong"
            >
              <Icon name="check" size={16} /> Fet
            </button>
            <button
              onClick={onOpenOptions}
              className="inline-flex items-center gap-1.5 bg-surface2 border border-line2 text-ink font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:border-faint"
            >
              <Icon name="chev" size={16} /> Opcions
            </button>
          </>
        ) : (
          <>
            {(status === 'done' || status === 'changed' || status === 'partial') && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 bg-surface2 border border-line2 text-ink font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:border-faint"
              >
                <Icon name="edit" size={15} /> Editar
              </button>
            )}
            <button
              onClick={onUndo}
              className="inline-flex items-center gap-1.5 text-muted font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:text-ink"
            >
              <Icon name="swap" size={15} /> Desfer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
