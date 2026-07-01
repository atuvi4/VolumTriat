import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Button from './Button';
import Icon from './Icon';
import ShoppingListSheet from './sheets/ShoppingListSheet';
import FirstDaySheet from './sheets/FirstDaySheet';
import InitialWeightSheet from './sheets/InitialWeightSheet';
import { daysUntilStart } from '../utils/project';
import { longDate } from '../utils/date';

const CHECKLIST: { id: string; label: string; optional?: boolean }[] = [
  { id: 'buy', label: 'Comprar aliments base' },
  { id: 'shakes', label: 'Deixar 2 batuts definits' },
  { id: 'snacks', label: 'Preparar opcions de snack' },
  { id: 'weigh', label: 'Pesar-me el matí del Dia 1' },
  { id: 'photo', label: 'Fer foto inicial', optional: true },
  { id: 'reminders', label: 'Configurar recordatoris' },
];

export default function PrepDashboard() {
  const { state, openSheet, togglePrep, startToday, showToast } = useApp();
  const start = state.profile.projectStartDate;
  const days = daysUntilStart(start);
  const startLabel = longDate(new Date(start + 'T00:00:00'));
  const doneCount = CHECKLIST.filter((c) => state.prepDone.includes(c.id)).length;

  return (
    <section>
      <div className="pt-[18px] pb-1.5">
        <span className="inline-flex items-center gap-2 font-bold text-[12.5px] px-3 py-[7px] rounded-full bg-warn-soft text-warn">
          <span className="w-[7px] h-[7px] rounded-full bg-current" /> Fase de preparació
        </span>
      </div>

      {/* HERO preparació */}
      <div className="hero-grad text-white rounded-xl2 shadow-hero relative overflow-hidden p-[22px] mb-3.5">
        <span className="absolute right-[-40px] top-[-40px] w-[180px] h-[180px] rounded-full bg-white/[.06]" />
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-white/70 relative">
          {days > 0 ? `Project75 comença en ${days} ${days === 1 ? 'dia' : 'dies'}` : 'Comences avui'}
        </span>
        <div className="text-[22px] font-extrabold leading-tight mt-2 mb-1.5 relative">
          Comences {startLabel.toLowerCase()}
        </div>
        <p className="text-white/80 text-[14px] m-0 relative">
          Objectiu: arribar preparat, no començar improvisant. Avui toca deixar el sistema a punt, no fer-ho perfecte.
        </p>
        <div className="flex gap-2.5 mt-4 relative flex-wrap">
          <Button className="bg-white !text-accent-strong border-0" icon="check" onClick={startToday}>
            Començar avui
          </Button>
          <Button variant="line" onClick={() => openSheet(<ShoppingListSheet />)}>
            Veure llista de compra
          </Button>
        </div>
      </div>

      {/* Checklist de preparació */}
      <Card title={`Preparació · ${doneCount}/${CHECKLIST.length}`} className="mb-3.5">
        <div className="flex flex-col">
          {CHECKLIST.map((c) => {
            const done = state.prepDone.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => togglePrep(c.id)}
                className="flex items-center gap-3 py-2.5 text-left"
              >
                <span
                  className={`w-[22px] h-[22px] rounded-[7px] grid place-items-center border shrink-0 ${
                    done ? 'bg-accent border-accent text-white' : 'border-line2 text-transparent'
                  }`}
                >
                  <Icon name="check" size={14} />
                </span>
                <span className={`font-semibold text-[14.5px] ${done ? 'text-muted line-through' : ''}`}>
                  {c.label}
                  {c.optional && <span className="text-faint font-medium"> · opcional</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Accions de preparació */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="ghost" icon="nutri" onClick={() => openSheet(<FirstDaySheet />)}>Definir primer dia</Button>
        <Button variant="ghost" icon="scale" onClick={() => openSheet(<InitialWeightSheet />)}>Registrar pes inicial</Button>
        <Button variant="ghost" icon="cup" onClick={() => openSheet(<ShoppingListSheet />)}>Llista de compra</Button>
        <Button variant="ghost" icon="clock" onClick={() => showToast('Recordatoris: arriben amb el desplegament (Web Push)')}>Activar recordatoris</Button>
      </div>

      <p className="text-[12px] text-faint text-center mt-4">
        Les ratxes, la constància i la tendència només compten des del {startLabel.toLowerCase()}.
      </p>
    </section>
  );
}
