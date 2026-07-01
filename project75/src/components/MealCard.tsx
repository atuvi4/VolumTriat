import type { ResolvedMeal } from '../nutrition/nutritionTypes';
import { SOURCE_META, precisionSummary } from '../nutrition/nutritionSources';
import Icon from './Icon';

interface Props {
  meal: ResolvedMeal;
  onComplete: () => void;
  onSwap: () => void;
  onDislike: () => void;
  onViewCalc: () => void;
}

export default function MealCard({ meal, onComplete, onSwap, onDislike, onViewCalc }: Props) {
  const n = meal.nutrition;
  const sources = meal.sources.map((s) => SOURCE_META[s].short).join(' · ');
  return (
    <div
      className={`border rounded-2xl p-[15px] mt-[11px] transition-colors ${
        meal.done ? 'bg-surface2 border-line' : 'bg-surface border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.07em] text-faint font-bold">{meal.slot}</div>
          <div className={`font-bold text-[15.5px] mt-[3px] ${meal.done ? 'text-muted' : ''}`}>{meal.name}</div>
        </div>
        {meal.tags.includes('supplement') && (
          <span className="text-[10.5px] font-bold text-info bg-info-soft px-2 py-1 rounded-full shrink-0">Suplement</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-2 text-[13px] font-semibold text-muted">
        <span>{n.kcal} kcal</span>
        <span>{n.protein} g proteïna</span>
        <span className="text-faint font-medium">{n.carbs}C · {n.fat}G</span>
      </div>

      {/* transparència de dades */}
      <button
        onClick={onViewCalc}
        className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold text-muted hover:text-accent"
      >
        <Icon name="database" size={13} />
        {precisionSummary(meal.precision, meal.confidence)} · Fonts: {sources}
        <span className="text-accent">· Veure càlcul</span>
      </button>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {meal.done ? (
          <span className="inline-flex items-center gap-1.5 text-accent font-bold text-[13.5px]">
            <Icon name="check" size={16} /> Completat
          </span>
        ) : (
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-1.5 bg-accent text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:bg-accent-strong"
          >
            <Icon name="check" size={16} /> Completar
          </button>
        )}
        <button
          onClick={onSwap}
          className="inline-flex items-center gap-1.5 bg-surface2 border border-line2 text-ink font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:border-faint"
        >
          <Icon name="swap" size={16} /> Canviar
        </button>
        <button
          onClick={onDislike}
          className="inline-flex items-center gap-1.5 bg-surface2 border border-line2 text-ink font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:border-faint"
        >
          <Icon name="x" size={16} /> No em ve de gust
        </button>
      </div>
    </div>
  );
}
