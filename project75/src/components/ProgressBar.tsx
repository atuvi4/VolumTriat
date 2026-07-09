import { pct } from '../utils/format';

interface Props {
  value: number;
  max: number;
  label?: string;
  valueLabel?: string;
  big?: boolean;
  color?: 'accent' | 'prot';
}

export default function ProgressBar({ value, max, label, valueLabel, big, color = 'accent' }: Props) {
  const fill =
    color === 'prot'
      ? 'bg-gradient-to-r from-accent-bright to-[#16C79A]'
      : 'bg-gradient-to-r from-accent to-accent-bright';
  return (
    <div>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-[7px] text-[13.5px] font-semibold">
          <span>{label}</span>
          <span className="text-muted">{valueLabel}</span>
        </div>
      )}
      <div className={`${big ? 'h-[11px]' : 'h-2'} bg-track rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full ${fill} transition-[width] duration-500`}
          style={{ width: `${pct(value, max)}%` }}
        />
      </div>
    </div>
  );
}
