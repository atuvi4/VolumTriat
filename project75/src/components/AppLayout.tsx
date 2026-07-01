import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Sheet from './Sheet';
import Icon from './Icon';
import { useApp } from '../hooks/useAppState';
import { isStarted } from '../utils/project';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { state, toast, sheet, closeSheet } = useApp();
  const started = isStarted(state.profile.projectStartDate);

  return (
    <div className="flex min-h-screen max-w-[1280px] mx-auto">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-[88px] md:pb-0">
        {/* Appbar (mobile) */}
        <header className="md:hidden sticky top-0 z-[15] glass-canvas border-b border-line flex items-center justify-between px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center text-white font-extrabold text-[13px] bg-[linear-gradient(145deg,#12aa80,#0B6450)]">
              75
            </div>
            <span className="font-extrabold text-[15px]">Project75</span>
          </div>
          {started ? (
            <span className="inline-flex items-center gap-1.5 bg-warn-soft text-warn font-bold text-[13px] px-3 py-[7px] rounded-full">
              <Icon name="flame" size={16} /> {state.streak}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-warn-soft text-warn font-bold text-[12px] px-3 py-[7px] rounded-full">
              Preparació
            </span>
          )}
        </header>

        <div className="max-w-[960px] mx-auto px-[18px] md:px-[30px] pb-11 animate-fade">{children}</div>
      </main>

      <MobileNav />

      <Sheet open={!!sheet} onClose={closeSheet}>
        {sheet}
      </Sheet>

      {toast && (
        <div className="fixed bottom-[102px] md:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white px-[18px] py-3 rounded-[13px] text-[13.5px] font-semibold shadow-lg2 max-w-[86%] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
