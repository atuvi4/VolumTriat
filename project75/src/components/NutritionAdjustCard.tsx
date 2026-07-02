import Icon from './Icon';
import Button from './Button';
import { CONFIDENCE_LABEL } from '../nutrition/nutritionSources';
import type { NutritionAdjust } from '../utils/nutritionAdvice';

const tone = {
  accent: { border: 'border-accent-line', bar: 'bg-accent', head: 'text-accent-strong' },
  warn: { border: 'border-[#EAD8C2]', bar: 'bg-warn', head: 'text-warn' },
  info: { border: 'border-[#D3E0FC]', bar: 'bg-info', head: 'text-info' },
};

interface Props {
  adjust: NutritionAdjust;
  onAddShake: () => void;
  onRescue: () => void;
}

/** Targeta curta d'ajust del dia. Només mostra accions accionables;
 *  no modifica el menú, no registra calories ni replanifica res. */
export default function NutritionAdjustCard({ adjust, onAddShake, onRescue }: Props) {
  const t = tone[adjust.tone];
  return (
    <div className={`relative overflow-hidden bg-surface border ${t.border} rounded-xl2 p-4 pl-[18px]`}>
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} />
      <div className={`flex items-center gap-2 font-bold text-[13px] mb-1.5 ${t.head}`}>
        <Icon name="target" size={16} /> {adjust.title}
      </div>

      {adjust.note && <p className="text-[13.5px] text-ink/80 m-0 mb-2">{adjust.note}</p>}

      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {adjust.actions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] leading-snug">
            <Icon name="chev" size={15} className="text-faint shrink-0 mt-[3px]" />
            <span>{a}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
          <Icon name="database" size={12} /> {adjust.read}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
          <Icon name="info" size={12} /> confiança {CONFIDENCE_LABEL[adjust.confidence]}
        </span>
      </div>

      {(adjust.primary || adjust.secondary) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {adjust.primary && (
            <Button
              size="sm"
              variant="primary"
              icon={adjust.primary === 'rescue' ? 'alert' : 'cup'}
              onClick={adjust.primary === 'rescue' ? onRescue : onAddShake}
            >
              {adjust.primaryLabel}
            </Button>
          )}
          {adjust.secondary && (
            <Button
              size="sm"
              variant="ghost"
              icon={adjust.secondary === 'rescue' ? 'alert' : 'cup'}
              onClick={adjust.secondary === 'rescue' ? onRescue : onAddShake}
            >
              {adjust.secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
