import type { Recommendation } from '../types';
import Icon from './Icon';
import Button from './Button';
import { CONFIDENCE_LABEL } from '../nutrition/nutritionSources';

const tone = {
  accent: { border: 'border-accent-line', bar: 'bg-accent', head: 'text-accent-strong' },
  warn: { border: 'border-warn-line', bar: 'bg-warn', head: 'text-warn' },
  info: { border: 'border-info-line', bar: 'bg-info', head: 'text-info' },
};

interface Props {
  rec: Recommendation;
  onAction?: (kind: NonNullable<Recommendation['action']>['kind']) => void;
}

export default function CoachRecommendation({ rec, onAction }: Props) {
  const t = tone[rec.tone];
  return (
    <div className={`relative overflow-hidden bg-surface border ${t.border} rounded-xl2 p-4 pl-[18px] h-full`}>
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} />
      <div className={`flex items-center gap-2 font-bold text-[13px] mb-1.5 ${t.head}`}>
        <Icon name="coach" size={16} /> {rec.title}
      </div>
      <p className="text-[14px] leading-relaxed m-0">{rec.body}</p>

      {rec.why && (
        <p className="text-[12.5px] text-muted mt-2 m-0">
          <b className="text-ink">Per què:</b> {rec.why}
        </p>
      )}
      {(rec.dataUsed || rec.confidence) && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {rec.dataUsed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
              <Icon name="database" size={12} /> {rec.dataUsed}
            </span>
          )}
          {rec.confidence && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
              <Icon name="info" size={12} /> confiança {CONFIDENCE_LABEL[rec.confidence]}
            </span>
          )}
        </div>
      )}

      {rec.action && onAction && (
        <div className="mt-3">
          <Button size="sm" variant={rec.tone === 'warn' ? 'ghost' : 'primary'} onClick={() => onAction(rec.action!.kind)}>
            {rec.action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
