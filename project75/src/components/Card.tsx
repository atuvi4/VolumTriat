import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: Props) {
  return (
    <div className={`bg-surface border border-line rounded-xl2 shadow-card p-[18px] ${className}`}>
      {title && (
        <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-faint mb-3">{title}</h2>
      )}
      {children}
    </div>
  );
}
