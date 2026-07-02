import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import Badge from '../components/Badge';
import CoachRecommendation from '../components/CoachRecommendation';
import Button from '../components/Button';
import Icon from '../components/Icon';
import InitialWeightSheet from '../components/sheets/InitialWeightSheet';
import { getRecommendations, getCoachLine } from '../utils/coach';
import { goalsFor, doneKcal, doneProt } from '../utils/goals';
import { nf } from '../utils/format';
import { isStarted, daysUntilStart } from '../utils/project';
import type { RecAction } from '../types';

export default function Coach() {
  const app = useApp();
  const { state, addShake, toggleHardDay, setTab, openSheet } = app;

  if (!isStarted(state.profile.projectStartDate)) {
    const days = daysUntilStart(state.profile.projectStartDate);
    return (
      <section>
        <PageHead title="Coach" sub="Fase de preparació" right={<Badge tone="warn">Preparació</Badge>} />
        <Card className="border-accent-line">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-accent-soft text-accent grid place-items-center">
              <Icon name="coach" size={18} />
            </div>
            <div>
              <b className="text-[14.5px]">Recomanació del coach</b>
              <span className="block text-[11.5px] text-faint -mt-px">Abans de començar</span>
            </div>
          </div>
          <p className="text-[16px] leading-relaxed font-medium m-0">
            {days > 0 ? `Comences en ${days} ${days === 1 ? 'dia' : 'dies'}.` : 'Comences avui.'} No et mesuro res encara: no vull dades falses.
            Avui la feina és <b>deixar-ho tot a punt</b> (compra, batuts, pes del Dia 1). Quan comencis, les recomanacions es basaran en dades reals.
          </p>
          <div className="mt-3.5">
            <Button variant="primary" icon="home" onClick={() => setTab('avui')}>Veure preparació</Button>
          </div>
        </Card>
      </section>
    );
  }

  const g = goalsFor(state);
  const left = Math.max(0, g.kcal - doneKcal(state.meals));
  const recs = getRecommendations(state);

  const onAction = (kind: RecAction) => {
    if (kind === 'addShake') addShake();
    else if (kind === 'hardDay') toggleHardDay();
    else if (kind === 'openNutrition') setTab('nutri');
    else if (kind === 'addWeight') { openSheet(<InitialWeightSheet />); }
    else if (kind === 'lowAppetite') app.toggleLowAppetite();
  };

  return (
    <section>
      <PageHead title="Coach" sub="Recomanacions segons les teves dades" />

      {/* card principal */}
      <Card className="border-accent-line mb-3.5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-accent-soft text-accent grid place-items-center">
            <Icon name="coach" size={18} />
          </div>
          <div>
            <b className="text-[14.5px]">Recomanació del coach</b>
            <span className="block text-[11.5px] text-faint -mt-px">Basada en el teu dia i estat</span>
          </div>
        </div>
        <p className="text-[16px] leading-relaxed font-medium m-0">{getCoachLine(state)}</p>
        <div className="flex flex-wrap gap-2.5 mt-3.5">
          <div className="flex-1 min-w-[130px] bg-surface2 border border-line rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-faint font-bold uppercase tracking-wide">Estat</div>
            <div className="text-[15px] font-bold mt-0.5">{g.label}</div>
          </div>
          <div className="flex-1 min-w-[130px] bg-surface2 border border-line rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-faint font-bold uppercase tracking-wide">Calories restants</div>
            <div className="text-[15px] font-bold mt-0.5">{nf(left)} kcal</div>
          </div>
          <div className="flex-1 min-w-[130px] bg-surface2 border border-line rounded-xl px-3.5 py-2.5">
            <div className="text-[11px] text-faint font-bold uppercase tracking-wide">Proteïna</div>
            <div className="text-[15px] font-bold mt-0.5">{doneProt(state.meals)} / {g.prot} g</div>
          </div>
        </div>
      </Card>

      {/* recomanacions accionables */}
      <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-faint mb-2.5 px-1">Accions recomanades</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {recs.map((r) => (
          <CoachRecommendation key={r.id} rec={r} onAction={onAction} />
        ))}
      </div>

      <div className="mt-3.5 border border-dashed border-line rounded-xl2 p-4 text-muted">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">Assistent conversacional amb IA</span>
          <Badge tone="info" dot={false}>V3</Badge>
        </div>
        <p className="text-[13px] m-0 mt-2">
          Aviat podràs preguntar-li directament. De moment, les recomanacions es generen amb regles segons les teves dades.
        </p>
      </div>
    </section>
  );
}
