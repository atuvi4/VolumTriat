import Icon from './Icon';
import { useApp } from '../hooks/useAppState';
import { isStarted } from '../utils/project';
import type { IconName, Tab } from '../types';

const ITEMS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'avui', label: 'Avui', icon: 'home' },
  { id: 'nutri', label: 'Nutrició', icon: 'nutri' },
  { id: 'gym', label: 'Entrenament', icon: 'train' },
  { id: 'evo', label: 'Evolució', icon: 'evo' },
  { id: 'coach', label: 'Coach', icon: 'coach' },
  { id: 'config', label: 'Configuració', icon: 'settings' },
];

export default function Sidebar() {
  const { tab, setTab, state } = useApp();
  return (
    <aside className="hidden md:flex flex-col w-[250px] shrink-0 border-r border-line bg-surface p-6 sticky top-0 h-screen">
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-[11px] grid place-items-center text-white font-extrabold text-[15px] tracking-tight shadow-[0_4px_12px_rgba(11,100,80,.28)] bg-[linear-gradient(145deg,#12aa80,#0B6450)]">
          75
        </div>
        <div className="leading-tight">
          <div className="font-extrabold text-[17px]">Project75</div>
          <div className="text-[11px] text-faint font-medium">Nutrition-first hybrid coach</div>
        </div>
      </div>

      <nav className="mt-7 flex flex-col gap-[3px] flex-1">
        {ITEMS.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-[11px] rounded-[11px] font-semibold text-[14.5px] transition-colors ${
                active ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:bg-surface2 hover:text-ink'
              }`}
            >
              <Icon name={it.icon} className={active ? 'text-accent' : 'text-faint'} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-line pt-3.5 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full bg-accent-soft text-accent-strong font-bold grid place-items-center text-[14px]">
            {state.profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-[13.5px]">{state.profile.name}</div>
            <div className="text-[11.5px] text-faint">
              {state.profile.startWeight} → {state.profile.target1}-{state.profile.target2} kg
            </div>
          </div>
        </div>
        {isStarted(state.profile.projectStartDate) ? (
          <div className="flex items-center gap-1.5 mt-3 text-warn font-bold text-[13px]">
            <Icon name="flame" size={16} /> {state.streak} dies de ratxa
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-3 text-warn font-bold text-[13px]">
            <span className="w-[7px] h-[7px] rounded-full bg-current" /> Fase de preparació
          </div>
        )}
      </div>
    </aside>
  );
}
