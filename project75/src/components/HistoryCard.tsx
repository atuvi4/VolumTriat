import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Icon from './Icon';
import { dailyHistory } from '../utils/history';
import { todayISO, shortDate } from '../utils/date';
import { fmt1 } from '../utils/format';

const WEEKDAY = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];

function weekdayShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return WEEKDAY[d.getDay()];
}

export default function HistoryCard() {
  const { state } = useApp();
  const days = dailyHistory(state);
  const goal = state.profile.kcalGoal || 0;

  return (
    <Card title="Historial de dies" className="mb-3.5">
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 text-muted py-4">
          <Icon name="calendar" size={24} className="text-faint" />
          <p className="m-0 text-[13.5px]">
            Encara no hi ha dies registrats. A mesura que marquis àpats, aquí veuràs el resum de cada dia.
          </p>
        </div>
      ) : (
        <div className="border border-line rounded-[12px] divide-y divide-line">
          {days.map((h) => {
            const isToday = h.date === todayISO();
            const hitGoal = goal > 0 && h.kcal >= goal * 0.9;
            return (
              <div key={h.date} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold flex items-center gap-1.5">
                    <span className="capitalize">{weekdayShort(h.date)}</span>
                    <span className="text-faint font-semibold">{shortDate(h.date)}</span>
                    {isToday && <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">Avui</span>}
                    {h.completed && <Icon name="checkCircle" size={14} className="text-accent" />}
                  </div>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    {h.logged} àpats registrats{h.skipped > 0 ? ` · ${h.skipped} saltats` : ''}
                    {h.weight != null ? ` · ${fmt1(h.weight)} kg` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[14px] font-extrabold ${hitGoal ? 'text-accent' : ''}`}>{h.kcal} kcal</div>
                  <div className="text-[11px] text-faint">{h.protein} g proteïna</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11.5px] text-faint m-0 mt-2.5">
        Resum aproximat del que has registrat cada dia (kcal i proteïna dels àpats marcats). {goal > 0 ? `Objectiu ${goal} kcal.` : ''}
      </p>
    </Card>
  );
}
