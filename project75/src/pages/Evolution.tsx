import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import InitialWeightSheet from '../components/sheets/InitialWeightSheet';
import HistoryCard from '../components/HistoryCard';
import { currentWeight, milestonesFor, nextMilestone, MIN_FOR_TREND } from '../utils/goals';
import { trendPerWeekWindow } from '../nutrition/adjustmentRules';
import { fmt1, pct } from '../utils/format';
import { shortDate, longDate } from '../utils/date';
import { isStarted, realWeights, consistencyPct } from '../utils/project';

export default function Evolution() {
  const { state, openSheet } = useApp();
  const p = state.profile;
  const started = isStarted(p.projectStartDate);
  const startLabel = longDate(new Date(p.projectStartDate + 'T00:00:00'));
  const rw = realWeights(state);

  // ---------- MODE PREPARACIÓ ----------
  if (!started) {
    return (
      <section>
        <PageHead title="Evolució" sub="Encara no has començat" right={<Badge tone="warn">Preparació</Badge>} />
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <MetricCard icon="scale" value={fmt1(p.startWeight)} unit="kg" label="Pes inicial (configurat)" />
          <MetricCard icon="target" value={String(p.target1)} unit="kg" label="Objectiu primer" />
          <MetricCard icon="calendar" value={p.projectStartDate.slice(8, 10) + '/' + p.projectStartDate.slice(5, 7)} label="Data d'inici" />
          <MetricCard icon="activity" value="—" label="Estat: preparació" tone="amber" />
        </div>
        <Card>
          <div className="flex items-center gap-2 text-muted">
            <Icon name="info" size={18} className="text-info" />
            <p className="m-0 text-[14.5px]">La tendència començarà quan registris pesos reals, a partir del {startLabel.toLowerCase()}.</p>
          </div>
          <div className="mt-3">
            <Button variant="ghost" icon="scale" onClick={() => openSheet(<InitialWeightSheet />)}>Definir pes inicial</Button>
          </div>
        </Card>
      </section>
    );
  }

  // ---------- MODE ACTIU ----------
  const hasWeights = rw.length > 0;
  const w = hasWeights ? currentWeight(rw) : p.startWeight;
  const canTrend = rw.length >= MIN_FOR_TREND;
  // Tendència única de l'app (14 dies), la mateixa que Nutrició i Coach.
  const trend = canTrend ? (trendPerWeekWindow(rw, 14) ?? 0) : 0;
  const next = nextMilestone(w, p.startWeight, p.target1);
  const miles = milestonesFor(p.startWeight, p.target1);
  const dir = Math.sign(p.target1 - p.startWeight) || 1;
  const cons = consistencyPct(state);

  const show = rw.slice(-8);
  const min = hasWeights ? Math.min(...show.map((x) => x.kg)) - 0.3 : 0;
  const max = hasWeights ? Math.max(...show.map((x) => x.kg)) + 0.3 : 1;

  return (
    <section>
      <PageHead title="Evolució" sub="La tendència, no el pes d'un dia" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3.5">
        <MetricCard icon="scale" value={hasWeights ? fmt1(w) : '—'} unit={hasWeights ? 'kg' : ''} label="Pes actual" />
        <MetricCard
          icon="activity"
          value={canTrend ? `${trend >= 0 ? '+' : ''}${fmt1(trend)}` : '—'}
          label={canTrend ? 'kg/setm · 14 dies' : 'tendència'}
          highlight={canTrend && trend >= 0.2}
        />
        <MetricCard icon="target" value={String(next)} unit="kg" label="Fita propera" />
        <MetricCard icon="calendar" value={cons != null ? String(cons) : '—'} unit={cons != null ? '%' : ''} label="Constància 30d" tone="amber" />
      </div>

      <Card
        title={`Camí cap a ${p.target1} kg${p.target2 !== p.target1 ? ` · després ${p.target2} kg` : ''}`}
        className="mb-3.5"
      >
        <div className="flex justify-between font-bold text-[13px] mb-2.5">
          <span>{p.startWeight} kg</span>
          <b className="text-accent">{hasWeights ? fmt1(w) + ' kg' : 'sense pes'}</b>
          <span>{p.target1} kg</span>
        </div>
        <div className="h-[11px] bg-track rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-[width] duration-500" style={{ width: `${pct(w - p.startWeight, p.target1 - p.startWeight)}%` }} />
        </div>
        <div className="relative h-[26px] mt-2.5">
          {miles.map((m) => {
            const hit = hasWeights && (dir > 0 ? w >= m : w <= m);
            return (
              <div key={m} className={`absolute -translate-x-1/2 text-[11px] font-bold text-center ${hit ? 'text-accent-strong' : 'text-faint'}`} style={{ left: `${((m - p.startWeight) / (p.target1 - p.startWeight)) * 100}%` }}>
                <span className={`block w-[9px] h-[9px] rounded-full mx-auto mb-1 border-2 border-surface ${hit ? 'bg-accent shadow-[0_0_0_1px_#0E7A5F]' : 'bg-[#D3D7DD] shadow-[0_0_0_1px_#D3D7DD]'}`} />
                {m}
              </div>
            );
          })}
        </div>
        {!canTrend && (
          <p className="text-[13px] text-muted mt-4 m-0">
            Dades insuficients per tendència ({rw.length}/{MIN_FOR_TREND} registres). Pesa't 2-3 cops per setmana; en tindràs prou en pocs dies.
          </p>
        )}
      </Card>

      <Card title="Pes · registres reals" className="mb-3.5">
        {hasWeights ? (
          <div className="h-[150px] flex items-end gap-2 pt-2 pb-6 relative">
            {show.map((x) => (
              <div key={x.d} className="flex-1 chart-grad rounded-t-[7px] rounded-b-[3px] relative group min-h-[8px]" style={{ height: `${((x.kg - min) / (max - min)) * 100}%` }}>
                <span className="absolute -top-[17px] left-0 right-0 text-center text-[10px] font-bold text-muted opacity-0 group-hover:opacity-100 transition-opacity">{fmt1(x.kg)}</span>
                <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-faint font-semibold">{shortDate(x.d)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[110px] flex flex-col items-center justify-center text-center gap-2 text-muted">
            <Icon name="activity" size={26} className="text-faint" />
            <p className="m-0 text-[13.5px]">Encara no hi ha pesos registrats. El primer serà el teu punt de partida real.</p>
          </div>
        )}
      </Card>

      <HistoryCard />

      <div className="flex flex-wrap gap-2.5">
        <Button block variant="primary" icon="plus" onClick={() => openSheet(<InitialWeightSheet />)}>
          {hasWeights ? 'Afegir pes' : 'Registrar primer pes'}
        </Button>
      </div>
    </section>
  );
}
