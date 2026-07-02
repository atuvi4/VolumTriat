import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import Badge from '../components/Badge';
import TrainingDayCard from '../components/TrainingDayCard';
import CategoryTag from '../components/CategoryTag';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { WEEK, WEEK_ORDER, DAY_ABBR, CAT_LABEL, todayWorkout } from '../data/week';
import { isStarted, inAdaptationWeek, startWeekSundayISO, projectDay } from '../utils/project';
import { todayISO, toLocalISO } from '../utils/date';
import type { WorkoutDay } from '../types';

const ADAPT: WorkoutDay[] = [
  { label: 'Sessió suau + primer dia de nutrició', type: 'gym', focus: "El focus real d'avui és la nutrició: primer dia complet. L'entrenament, suau." },
  { label: 'Gym o running zona 2 · 30-40 min', type: 'run', focus: 'Tu tries: gym de base o un running suau. Sense intensitat.' },
  { label: 'Descans o caminada', type: 'rest', focus: 'Dia lleuger. Opcional: bici només si ve de gust, mai per obligació.' },
];
const abbrOf = (iso: string) => DAY_ABBR[new Date(iso + 'T00:00:00').getDay()];
const ddmm = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);

function adaptationDays(startISO: string): { iso: string; day: WorkoutDay }[] {
  const sunday = startWeekSundayISO(startISO);
  const out: { iso: string; day: WorkoutDay }[] = [];
  const cur = new Date(startISO + 'T00:00:00');
  const end = new Date(sunday + 'T00:00:00');
  let i = 0;
  while (cur.getTime() <= end.getTime()) {
    const iso = toLocalISO(cur);
    out.push({ iso, day: ADAPT[Math.min(i, ADAPT.length - 1)] });
    cur.setDate(cur.getDate() + 1);
    i++;
  }
  return out;
}

export default function Training() {
  const { state, markGym } = useApp();
  const start = state.profile.projectStartDate;
  const started = isStarted(start);

  // ---------- PREPARACIÓ ----------
  if (!started) {
    const preview = adaptationDays(start);
    return (
      <section>
        <PageHead title="Entrenament" sub="Encara no has començat" right={<Badge tone="warn">Preparació</Badge>} />
        <PhaseCard />
        <Card title="Primera setmana proposta (adaptació)" className="mb-3.5">
          <div className="flex flex-col">
            {preview.map(({ iso, day }) => (
              <TrainingDayCard key={iso} abbr={abbrOf(iso)} date={ddmm(iso)} day={day} />
            ))}
          </div>
          <p className="text-[13px] text-muted mt-3 m-0">
            No hi ha res "pendent" ni "fallat" abans de començar. Dilluns següent arrenca la setmana estructurada normal.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-muted">
            <Icon name="info" size={18} className="text-info" />
            <p className="m-0 text-[14.5px]">La primera setmana és d'adaptació: prioritat total a la nutrició i sessions suaus.</p>
          </div>
        </Card>
      </section>
    );
  }

  // ---------- SETMANA D'ADAPTACIÓ (parcial) ----------
  if (inAdaptationWeek(start)) {
    const days = adaptationDays(start);
    const idx = Math.min(projectDay(start) - 1, ADAPT.length - 1);
    const w = ADAPT[idx];
    return (
      <section>
        <PageHead title="Entrenament" sub={`Setmana 0 · Adaptació · Dia ${projectDay(start)}`} right={<Badge>Adaptació</Badge>} />
        <PhaseCard />
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-3.5 items-start">
          <Card title="Setmana 0 · Adaptació">
            <div className="flex flex-col">
              {days.map(({ iso, day }) => (
                <TrainingDayCard key={iso} abbr={abbrOf(iso)} date={ddmm(iso)} day={day} now={iso === todayISO()} done={iso === todayISO() && state.gymDone} />
              ))}
            </div>
            <p className="text-[13px] text-muted mt-3 m-0">Dilluns comença la setmana estructurada normal.</p>
          </Card>
          <FocusCard w={w} done={state.gymDone} onMark={markGym} soft />
        </div>
      </section>
    );
  }

  // ---------- SETMANA NORMAL ----------
  const today = new Date().getDay();
  const w = todayWorkout();
  const base = new Date();
  const tomorrow = (today + 1) % 7;
  const conflict = w.label === 'Cames' && (WEEK[tomorrow].type === 'run' || WEEK[tomorrow].type === 'bike');

  return (
    <section>
      <PageHead title="Entrenament" sub="Gym base + running · triatló progressiu" />
      <PhaseCard />
      <div className="grid md:grid-cols-[1.15fr_1fr] gap-3.5 items-start">
        <Card title="Planning de la setmana">
          <div className="flex flex-col">
            {WEEK_ORDER.map((d) => {
              const dd = new Date(base);
              dd.setDate(base.getDate() + ((d - today + 7) % 7));
              return (
                <TrainingDayCard key={d} abbr={DAY_ABBR[d]} date={`${dd.getDate()}/${dd.getMonth() + 1}`} day={WEEK[d]} now={d === today} done={d === today && state.gymDone} />
              );
            })}
          </div>
        </Card>
        <div className="flex flex-col gap-3.5">
          <FocusCard w={w} done={state.gymDone} onMark={markGym} />
          {conflict && (
            <div className="relative overflow-hidden bg-surface border border-[#EAD8C2] rounded-xl2 p-4 pl-[18px]">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-warn" />
              <div className="flex items-center gap-2 font-bold text-[12.5px] mb-[7px] text-warn">
                <Icon name="alert" size={16} /> Possible conflicte
              </div>
              <p className="text-[14.5px] leading-relaxed m-0">
                Demà toca <b>{CAT_LABEL[WEEK[tomorrow].type].toLowerCase()}</b>. Si les cames van carregades, mou-lo un dia — el gym mana fins que el pes pugi de forma estable.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PhaseCard() {
  const combos = [
    'Gym tren superior + running zona 2: bona combinació.',
    'Gym cames + running: només suau i curt, o millor separar-ho si les cames estan carregades.',
    'Running intens: no el posis després d’un dia dur de cames.',
    'Deixa com a mínim 1 dia realment lleuger o de descans a la setmana.',
  ];
  return (
    <Card title="Fase actual" className="mb-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent grid place-items-center shrink-0">
          <Icon name="train" size={18} />
        </div>
        <div>
          <b className="block text-[15px] font-bold">Base actual: gym + running</b>
          <span className="text-[13px] text-muted">
            Triatló més endavant: la bici i la natació entraran progressivament, sense pressa.
          </span>
        </div>
      </div>

      <div className="mt-3.5 bg-surface2 border border-line rounded-xl p-3.5">
        <p className="text-[13.5px] leading-relaxed m-0">
          Pots combinar <b>gym + zona 2</b> el mateix dia si et va millor per horaris. Millor ajuntar
          càrrega que escampar-la i no descansar mai.
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {combos.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[13.5px] leading-snug">
            <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-accent shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FocusCard({ w, done, onMark, soft }: { w: WorkoutDay; done: boolean; onMark: () => void; soft?: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CategoryTag type={w.type} />
        {done ? (
          <span className="text-[11px] font-bold text-faint bg-surface2 px-[9px] py-1 rounded-full">Completat</span>
        ) : (
          <span className="text-[11px] font-bold text-accent bg-white border border-accent-line px-[9px] py-1 rounded-full">Avui</span>
        )}
      </div>
      <div className="text-[19px] font-extrabold mt-3 mb-1">{w.label}</div>
      <p className="text-muted text-[13px] m-0 mb-1">{w.focus}</p>
      <div className="mt-3.5">
        <Button variant="primary" className="w-full" icon="check" disabled={done} onClick={onMark}>
          {done ? 'Sessió completada' : 'Marcar sessió feta'}
        </Button>
      </div>
      <p className="text-muted text-[13px] mt-3 m-0">
        {soft ? 'Sense pressió: suau i curta. El que compta avui és la nutrició.' : "Pots registrar sèries (opcional): s'autocompleta amb l'últim pes."}
      </p>
    </Card>
  );
}
