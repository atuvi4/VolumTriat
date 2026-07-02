import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Icon from './Icon';
import { ANNUAL_ROADMAP, currentPhase } from '../data/annualRoadmap';

/** Card compacta del macrocicle anual (Roadmap v1).
 *  Mostra la fase actual i, plegat, la direcció dels 12 mesos.
 *  No planifica setmanes ni canvia rutina/menú: només orienta. */
export default function RoadmapCard({ className = '' }: { className?: string }) {
  const { state } = useApp();
  const phase = currentPhase(state);

  return (
    <Card title="Roadmap anual" className={className}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent grid place-items-center shrink-0">
          <Icon name="calendar" size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <b className="text-[15px] font-bold">{phase.name}</b>
            <span className="text-[11px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
              Fase {phase.order} de {ANNUAL_ROADMAP.length}
            </span>
          </div>
          <div className="text-[12.5px] text-faint font-semibold mt-0.5">{phase.durationLabel}</div>
          <p className="text-[14px] leading-relaxed mt-1 mb-0">{phase.goal}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="bg-surface2 border border-line rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent-strong mb-1">
            <Icon name="nutri" size={13} /> Nutrició
          </div>
          <p className="text-[13px] leading-snug m-0">{phase.nutritionFocus}</p>
        </div>
        <div className="bg-surface2 border border-line rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent-strong mb-1">
            <Icon name="train" size={13} /> Entrenament
          </div>
          <p className="text-[13px] leading-snug m-0">{phase.trainingFocus}</p>
        </div>
      </div>

      {phase.cautions.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {phase.cautions.map((c) => (
            <li key={c} className="flex items-start gap-2 text-[13px] text-muted leading-snug">
              <Icon name="info" size={13} className="text-info shrink-0 mt-[2px]" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {phase.microProgression && phase.microProgression.length > 0 && (
        <div className="mt-3 bg-surface2 border border-line rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent-strong mb-2">
            <Icon name="activity" size={13} /> Bici i natació · microdosi tècnica
          </div>
          <ol className="flex flex-col gap-1.5 pl-0 list-none">
            {phase.microProgression.map((s) => (
              <li key={s.weeks} className="flex items-start gap-2 text-[13px] leading-snug">
                <span className="text-[11px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md shrink-0">
                  {s.weeks}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
          {phase.notes && phase.notes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {phase.notes.map((n) => (
                <span
                  key={n}
                  className="text-[11.5px] font-semibold text-muted bg-surface border border-line rounded-full px-2.5 py-1"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <details className="mt-3 group">
        <summary className="cursor-pointer text-[13px] font-semibold text-accent list-none flex items-center gap-1">
          <Icon name="chev" size={14} /> Veure els 12 mesos
        </summary>
        <ol className="mt-2 flex flex-col gap-2 pl-0 list-none">
          {ANNUAL_ROADMAP.map((p) => {
            const active = p.id === phase.id;
            return (
              <li
                key={p.id}
                className={`rounded-xl border px-3 py-2 ${
                  active ? 'bg-accent-soft border-accent-line' : 'bg-surface border-line'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${active ? 'text-accent-strong' : 'text-faint'}`}>
                    F{p.order}
                  </span>
                  <b className="text-[13.5px]">{p.name}</b>
                  <span className="text-[11.5px] text-faint font-semibold ml-auto">{p.durationLabel}</span>
                </div>
                <p className="text-[12.5px] text-muted m-0 mt-0.5">{p.goal}</p>
              </li>
            );
          })}
        </ol>
        <p className="text-[12px] text-faint m-0 mt-2">
          Guia de direcció, no un calendari rígid. Les durades són aproximades i s'ajusten al progrés real.
        </p>
      </details>
    </Card>
  );
}
