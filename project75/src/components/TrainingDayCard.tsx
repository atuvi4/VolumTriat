import type { WorkoutDay } from '../types';
import CategoryTag from './CategoryTag';

interface Props {
  abbr: string;
  date: string;
  day: WorkoutDay;
  now?: boolean;
  done?: boolean;
}

export default function TrainingDayCard({ abbr, date, day, now, done }: Props) {
  return (
    <div className={`relative flex items-center gap-3.5 px-3 py-3 rounded-[13px] ${now ? 'bg-accent-soft' : ''}`}>
      {now && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded bg-accent" />}
      <div className="w-[42px] shrink-0">
        <b className="block text-[13px] font-bold">{abbr}</b>
        <span className="text-[11px] text-faint">{date}</span>
      </div>
      <span className="flex-1 font-semibold text-[14.5px]">{day.label}</span>
      <CategoryTag type={day.type} />
      {now && !done && (
        <span className="text-[11px] font-bold text-accent bg-white border border-accent-line px-[9px] py-1 rounded-full">
          Avui
        </span>
      )}
      {done && (
        <span className="text-[11px] font-bold text-faint bg-surface2 px-[9px] py-1 rounded-full">Fet</span>
      )}
    </div>
  );
}
