interface Props {
  percent: number;
  value: string;
  sub: string;
}

/** Anell de progrés (conic-gradient). Ideal per calories. */
export default function Ring({ percent, value, sub }: Props) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="relative w-[104px] h-[104px] rounded-full shrink-0"
      style={{ background: `conic-gradient(#12AA80, #0B6450 ${p}%, #EEF1F3 0)` }}
    >
      <div className="absolute inset-[9px] bg-surface rounded-full grid place-items-center text-center">
        <div>
          <div className="font-display text-[21px] font-bold leading-none tnum">{value}</div>
          <div className="text-[10.5px] text-muted mt-[3px]">{sub}</div>
        </div>
      </div>
    </div>
  );
}
