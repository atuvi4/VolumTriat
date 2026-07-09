import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Sheet({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-[rgba(17,24,39,.48)] backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet w-full max-w-[500px] md:max-w-[460px] max-h-[88dvh] overflow-y-auto bg-surface rounded-t-[22px] md:rounded-[22px] shadow-lg2 p-5 pb-[calc(26px+env(safe-area-inset-bottom))] md:pb-6"
      >
        <span className="md:hidden block w-9 h-1 rounded-full bg-line2 mx-auto -mt-1 mb-3" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-[19px] font-bold m-0">{title}</h3>
      {sub && <p className="text-muted text-[13.5px] mt-0.5 mb-1">{sub}</p>}
    </div>
  );
}

export function SheetOption({
  label,
  meta,
  onClick,
}: {
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex justify-between items-center gap-3 border border-line rounded-[14px] p-[15px] mt-2.5 font-semibold text-[14.5px] hover:border-accent hover:bg-accent-soft transition-colors"
    >
      <span>{label}</span>
      {meta && <span className="text-muted text-[13px] font-medium shrink-0">{meta}</span>}
    </button>
  );
}
