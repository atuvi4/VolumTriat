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
            className={`flex flex-col items-center gap-[3px] flex-1 py-[3px] text-[10.5px] font-semibold ${
              active ? 'text-accent' : 'text-faint'
            }`}
          >
            <Icon name={it.icon} size={22} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
