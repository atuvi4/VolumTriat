import type { ReactNode } from 'react';

type Tone = 'accent' | 'warn' | 'info';

const tones: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent-strong',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
};

export default function Badge({ tone = 'accent', dot = true, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-[12.5px] px-3 py-[7px] rounded-full ${tones[tone]}`}>
      {dot && <span className="w-[7px] h-[7px] rounded-full bg-current" />}
      {children}
    </span>
  );
}
