import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Ring from '../components/Ring';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import Icon from '../components/Icon';
import CategoryTag from '../components/CategoryTag';
import CheckinSheet from '../components/sheets/CheckinSheet';
import { goalsFor, doneKcal, doneProt, doneCount } from '../utils/goals';
import { getDirective, getCoachLine } from '../utils/coach';
import { greetName, longDate } from '../utils/date';
import { nf } from '../utils/format';
import { resolveTodayTraining } from '../data/week';
import { isStarted, projectDay } from '../utils/project';
import PrepDashboard from '../components/PrepDashboard';

export default function Today() {
  const app = useApp();
  const { state, setTab, addShake, toggleHardDay, openSheet } = app;

  if (!isStarted(state.profile.projectStartDate)) return <PrepDashboard />;
  const day = projectDay(state.profile.projectStartDate);
  const g = goalsFor(state);
  const dir = getDirective(state);
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const dc = doneCount(state.meals);
  const hard = state.dayMode === 'dificil';

  const stateBadge =
    hard ? <Badge tone="warn">Dia difícil</Badge> :
    state.dayMode === 'pocaGana' ? <Badge tone="info">Poca gana</Badge> :
    <Badge>Agressiu sostenible</Badge>;

  return (
    <section>
      <PageHead title="Avui" sub={`${greetName()}, ${state.profile.name} · ${longDate()} · Dia ${day}`} right={stateBadge} />

      {/* HERO — prioritat ara */}
      <div className="hero-grad noise text-white rounded-xl2 shadow-hero relative overflow-hidden p-[22px] mb-3.5">
        <span className="absolute right-[-40px] top-[-40px] w-[180px] h-[180px] rounded-full bg-white/[.06]" />
        <span className="absolute right-[36px] top-[52px] w-[90px] h-[90px] rounded-full border border-white/10" />
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-white/70 relative">Prioritat ara</span>
        <div className="font-display text-[24px] font-bold leading-tight mt-2 mb-1.5 relative">{dir.title}</div>
        <p className="text-white/80 text-[14px] m-0 relative">{dir.sub}</p>
        <div className="flex gap-2.5 mt-4 relative flex-wrap">
          {dir.cta === 'batut' ? (
            <>
              <Button className="bg-white !text-accent-strong border-0" icon="cup" onClick={addShake}>Afegir batut</Button>
              <Button variant="line" onClick={() => setTab('nutri')}>Veure nutrició</Button>
            </>
          ) : (
            <>
              <Button className="bg-white !text-accent-strong border-0" icon="nutri" onClick={() => setTab('nutri')}>Obrir nutrició</Button>
              <Button variant="line" onClick={() => openSheet(<CheckinSheet />)}>Fer check-in</Button>
            </>
          )}
        </div>
      </div>

      {/* STATS */}
      <Card className="flex items-center gap-5 flex-wrap mb-3.5">
        <Ring percent={(dk / g.kcal) * 100} value={nf(dk)} sub={`/ ${nf(g.kcal)} kcal`} />
        <div className="flex-1 min-w-[180px] flex flex-col gap-3.5">
          <ProgressBar color="prot" label="Proteïna" valueLabel={`${dp} / ${g.prot} g`} value={dp} max={g.prot} />
          <ProgressBar label="Àpats completats" valueLabel={`${dc} / ${g.meals}`} value={dc} max={g.meals} />
        </div>
      </Card>

      {/* 2 columnes: entrenament + coach */}
      <div className="grid md:grid-cols-2 gap-3.5">
        <Card title="Entrenament d'avui">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent grid place-items-center">
              <Icon name="train" />
            </div>
            <div className="flex-1">
              <b className="block text-[15px] font-bold">{w.label}</b>
              <span className="text-[12.5px] text-muted">{w.focus}</span>
            </div>
            <CategoryTag type={w.type} />
          </div>
          {t.soft && (
            <p className="text-[12px] text-muted mt-2.5 mb-0">
              {t.nutritionPriority ? 'Opcional i suau: avui el que compta és la nutrició.' : 'Sense pressió: suau i curt.'}
            </p>
          )}
        </Card>

        <div className={`relative overflow-hidden bg-surface border rounded-xl2 p-4 pl-[18px] ${hard ? 'border-warn-line' : 'border-accent-line'}`}>
          <span className={`absolute left-0 top-0 bottom-0 w-1 ${hard ? 'bg-warn' : 'bg-accent'}`} />
          <div className={`flex items-center gap-2 font-bold text-[12.5px] mb-[7px] ${hard ? 'text-warn' : 'text-accent-strong'}`}>
            <Icon name="coach" size={16} /> Recomanació del coach
          </div>
          <p className="text-[14.5px] leading-relaxed m-0">{getCoachLine(state)}</p>
        </div>
      </div>

      {/* accions ràpides */}
      <div className="grid grid-cols-3 gap-2.5 mt-3.5">
        <button onClick={() => openSheet(<CheckinSheet />)} className="flex flex-col items-center gap-1.5 bg-surface2 border border-line2 rounded-xl py-3 text-[12.5px] font-semibold hover:border-faint">
          <Icon name="checkCircle" size={19} /> Check-in
        </button>
        <button onClick={addShake} className="flex flex-col items-center gap-1.5 bg-surface2 border border-line2 rounded-xl py-3 text-[12.5px] font-semibold hover:border-faint">
          <Icon name="cup" size={19} /> Batut
        </button>
        <button onClick={toggleHardDay} className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-[12.5px] font-semibold border ${hard ? 'bg-info text-white border-info' : 'bg-surface2 border-line2 hover:border-faint'}`}>
          <Icon name={hard ? 'checkCircle' : 'moon'} size={19} /> {hard ? 'Sortir' : 'Dia difícil'}
        </button>
      </div>
    </section>
  );
}
