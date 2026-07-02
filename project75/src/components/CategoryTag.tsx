import type { WorkoutType } from '../types';
import { CAT_LABEL } from '../data/week';

const dot: Record<WorkoutType, string> = {
  gym: 'bg-cat-gym',
  run: 'bg-cat-run',
  bike: 'bg-cat-bike',
  swim: 'bg-cat-swim',
  rest: 'bg-faint',
};
const text: Record<WorkoutType, string> = {
  gym: 'text-cat-gym',
  run: 'text-cat-run',
  bike: 'text-cat-bike',
  swim: 'text-cat-swim',
  rest: 'text-muted',
};

export default function CategoryTag({ type }: { type: WorkoutType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-[5px] rounded-full bg-surface2 border border-line ${text[type]}`}
    >
      <span className={`w-[7px] h-[7px] rounded-full ${dot[type]}`} />
      {CAT_LABEL[type]}
    </span>
  );
}
