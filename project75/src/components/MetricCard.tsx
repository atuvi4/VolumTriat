import Icon from './Icon';
import type { IconName } from '../types';

interface Props {
  icon: IconName;
  value: string;
  unit?: string;
  label: string;
  tone?: 'accent' | 'amber';
  highlight?: boolean;
}

export default function MetricCard({ icon, value, unit, label, tone = 'accent', highlight }: Props) {
  const iconWrap = tone === 'amber' ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent';
  return (
    <div className="bg-surface border border-line rounded-2xl p-[15px] shadow-card">
      <div className={`w-[34px] h-[34px] rounded-[10px] grid place-items-center mb-[10px] ${iconWrap}`}>
        <Icon name={icon} size={17} />
      </div>
      <div className={`text-[22px] font-extrabold tracking-[-0.02em] ${highlight ? 'text-accent' : ''}`}>
        {value}
        {unit && <span className="text-[13px] font-semibold text-muted"> {unit}</span>}
      </div>
      <div className="text-[12px] text-muted font-semibold mt-[2px]">{label}</div>
    </div>
  );
}
