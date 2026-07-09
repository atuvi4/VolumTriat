import Icon from './Icon';
import { useApp } from '../hooks/useAppState';
import type { IconName, Tab } from '../types';

const ITEMS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'avui', label: 'Avui', icon: 'home' },
  { id: 'nutri', label: 'Nutrició', icon: 'nutri' },
  { id: 'gym', label: 'Gym', icon: 'train' },
  { id: 'evo', label: 'Evolució', icon: 'evo' },
  { id: 'coach', label: 'Coach', icon: 'coach' },
];

export default function MobileNav() {
  const { tab, setTab } = useApp();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-line flex justify-around px-1.5 pt-2 pb-[calc(9px+env(safe-area-inset-bottom))]">
      {ITEMS.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-[3px] flex-1 py-[3px] text-[11px] font-semibold transition-colors ${
              active ? 'text-accent-strong' : 'text-faint'
            }`}
          >
            <span className={`grid place-items-center h-[26px] px-4 rounded-full transition-colors ${active ? 'bg-accent-soft' : ''}`}>
              <Icon name={it.icon} size={21} />
            </span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
