import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Icon from './Icon';
import { lastNDaysSummary, listDailyLogs, logHasData } from '../history/dailyLog';
import type { DailyLog } from '../types';
import { addDaysISO, shortDate, todayISO } from '../utils/date';
import { fmt1, nf } from '../utils/format';

/* History & Analytics v1 — resum, gràfiques simples (CSS, cap llibreria) i
   llista de dies amb detall. Colors: verd = compleix (≥90% objectiu),
   ambre = curt, gris = sense dades. Tot orientatiu, mai diagnòstic. */

const WEEKDAY = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];
const weekday = (iso: string) => WEEKDAY[new Date(iso + 'T00:00:00').getDay()];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: 'Fet', cls: 'text-accent bg-accent-soft' },
  changed: { label: 'Canviat', cls: 'text-info bg-info-soft' },
  partial: { label: 'Parcial', cls: 'text-info bg-info-soft' },
  skipped: { label: 'Saltat', cls: 'text-muted bg-surface2' },
  pending: { label: 'No registrat', cls: 'text-faint bg-surface2' },
};

/** Barres d'un valor per dia amb línia d'objectiu. Verd/ambre/gris. */
function DayBars({ days, value, target, unit }: {
  days: (DailyLog | undefined)[];
  value: (l: DailyLog) => number;
  target: (l: DailyLog) => number;
  unit: string;
}) {
  const max = Math.max(...days.map((l) => (l ? Math.max(value(l), target(l)) : 0)), 1);
  return (
    <div className="flex items-end gap-1 h-[72px]">
      {days.map((l, i) => {
        const v = l ? value(l) : 0;
        const t = l ? target(l) : 0;
        const hit = l && t > 0 && v >= t * 0.9;
        return (
          <div key={i} className="flex-1 h-full relative flex items-end" title={l ? `${shortDate(l.date)} · ${v} ${unit}` : ''}>
            {l && t > 0 && (
              <span className="absolute left-0 right-0 border-t border-dashed border-faint/50" style={{ bottom: `${(t / max) * 100}%` }} />
            )}
            <div
              className={`w-full rounded-t-[4px] min-h-[2px] ${v === 0 ? 'bg-track' : hit ? 'bg-accent' : 'bg-warn/70'}`}
              style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'ok' | 'short' | 'none' }) {
  const cls = tone === 'ok' ? 'text-accent-strong' : tone === 'short' ? 'text-warn' : '';
  return (
    <div className="bg-surface2 border border-line rounded-[12px] px-3 py-2">
      <div className={`text-[17px] font-bold font-display tnum ${cls}`}>{value}</div>
      <div className="text-[11px] text-muted font-semibold">{label}</div>
    </div>
  );
}

export default function HistoryPanel() {
  const { state } = useApp();
  const s7 = lastNDaysSummary(state, 7);
  const logs = listDailyLogs(state).filter(logHasData).slice(0, 30);

  // 14 dies per a les gràfiques (buits inclosos, per veure la continuïtat real).
  const byDate = new Map(listDailyLogs(state).map((l) => [l.date, l]));
  const last14 = Array.from({ length: 14 }, (_, i) => byDate.get(addDaysISO(todayISO(), -(13 - i))));

  // Interpretacions honestes (orientatives, mai diagnòstic).
  const notes: string[] = [];
  if (s7.eatingDays >= 2) {
    notes.push(`Proteïna a l'objectiu ${s7.proteinHitDays} de ${s7.eatingDays} dies amb registre.`);
    if (s7.avgKcal != null) {
      const target = state.profile.kcalGoal;
      const diff = target - s7.avgKcal;
      if (diff > 150) notes.push(`Mitjana ${nf(s7.avgKcal)} / ${nf(target)} kcal — et falten ~${nf(diff)} kcal/dia. Un batut dens ho cobreix.`);
      else if (diff < -300) notes.push(`Mitjana ${nf(s7.avgKcal)} kcal, per sobre de l'objectiu. Si el pes puja dins del rang, cap problema.`);
      else notes.push(`Mitjana ${nf(s7.avgKcal)} / ${nf(target)} kcal — bon ritme: constància abans que perfecció.`);
    }
    if (s7.avgProtein != null && s7.avgProtein < state.profile.protGoal - 10) {
      notes.push(`La proteïna va curta: ${s7.avgProtein} g de mitjana (objectiu ${state.profile.protGoal} g).`);
    }
  } else {
    notes.push('Amb un parell de dies més de registre, aquí veuràs mitjanes i compliment.');
  }

  const weightDelta = s7.weightStart != null && s7.weightEnd != null ? s7.weightEnd - s7.weightStart : null;

  return (
    <>
      {/* Resum últims 7 dies */}
      <Card title="Últims 7 dies" className="mb-3.5">
        <div className="grid grid-cols-3 gap-2">
          <Stat
            value={s7.avgKcal != null ? nf(s7.avgKcal) : '—'}
            label="kcal/dia mitjana"
            tone={s7.avgKcal == null ? 'none' : s7.avgKcal >= state.profile.kcalGoal * 0.9 ? 'ok' : 'short'}
          />
          <Stat
            value={s7.avgProtein != null ? `${s7.avgProtein} g` : '—'}
            label="proteïna mitjana"
            tone={s7.avgProtein == null ? 'none' : s7.avgProtein >= state.profile.protGoal ? 'ok' : 'short'}
          />
          <Stat value={`${s7.completedDays}/7`} label="dies complets" tone={s7.completedDays >= 5 ? 'ok' : 'none'} />
          <Stat value={String(s7.trainingsDone)} label="entrenaments" tone={s7.trainingsDone >= 4 ? 'ok' : 'none'} />
          <Stat value={`${s7.creatineDays}/7`} label="creatina" tone={s7.creatineDays >= 6 ? 'ok' : 'none'} />
          <Stat
            value={weightDelta != null ? `${weightDelta >= 0 ? '+' : ''}${fmt1(weightDelta)} kg` : '—'}
            label="pes (inici→final)"
            tone={weightDelta == null ? 'none' : weightDelta > 0 ? 'ok' : 'short'}
          />
        </div>
        <div className="mt-3 space-y-1">
          {notes.map((n) => (
            <p key={n} className="text-[12.5px] text-muted m-0 flex items-start gap-1.5">
              <Icon name="chev" size={13} className="shrink-0 mt-[3px] text-faint" /> {n}
            </p>
          ))}
        </div>
      </Card>

      {/* Gràfiques 14 dies */}
      <Card title="Kcal i proteïna · 14 dies" className="mb-3.5">
        <div className="text-[11px] text-faint font-semibold mb-1">Calories (línia = objectiu del dia)</div>
        <DayBars days={last14} value={(l) => l.kcal} target={(l) => l.targetKcal} unit="kcal" />
        <div className="text-[11px] text-faint font-semibold mb-1 mt-3">Proteïna</div>
        <DayBars days={last14} value={(l) => l.protein} target={(l) => l.targetProtein} unit="g" />
        {/* Entrenament i creatina per dia */}
        <div className="flex gap-1 mt-3">
          {last14.map((l, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${l?.training.done ? 'bg-accent' : 'bg-track'}`} title="Entrenament" />
              <span className={`w-2 h-2 rounded-full ${l?.supplements.creatine ? 'bg-info' : 'bg-track'}`} title="Creatina" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1.5 text-[10.5px] text-faint font-semibold">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> entrenament</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> creatina</span>
        </div>
      </Card>

      {/* Historial per dies amb detall */}
      <Card title="Historial de dies" className="mb-3.5">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 text-muted py-4">
            <Icon name="calendar" size={24} className="text-faint" />
            <p className="m-0 text-[13.5px]">Encara no hi ha dies amb registre. Cada dia es guarda sol a mitjanit.</p>
          </div>
        ) : (
          <div className="border border-line rounded-[12px] divide-y divide-line">
            {logs.map((l) => {
              const isToday = l.date === state.date;
              const kcalOk = l.kcal >= l.targetKcal * 0.9;
              return (
                <details key={l.date} className="group">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-surface2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold flex items-center gap-1.5">
                        <span className="capitalize">{weekday(l.date)}</span>
                        <span className="text-faint font-semibold">{shortDate(l.date)}</span>
                        {isToday && <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">Avui</span>}
                        {l.completed && <Icon name="checkCircle" size={14} className="text-accent" />}
                        {l.training.done && <Icon name="train" size={13} className="text-muted" />}
                      </div>
                      <div className="text-[11.5px] text-muted mt-0.5">
                        {l.meals.filter((m) => m.kcal > 0).length + l.extras.length} ingestes
                        {l.weightKg != null ? ` · ${fmt1(l.weightKg)} kg` : ''}
                        {l.dayMode === 'dificil' ? ' · dia difícil' : l.dayMode === 'pocaGana' ? ' · poca gana' : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[14px] font-bold tnum ${l.kcal === 0 ? 'text-faint' : kcalOk ? 'text-accent-strong' : 'text-warn'}`}>
                        {nf(l.kcal)} kcal
                      </div>
                      <div className="text-[11px] text-faint tnum">{l.protein} g · obj {nf(l.targetKcal)}</div>
                    </div>
                  </summary>

                  {/* Detall del dia */}
                  <div className="px-3.5 pb-3 pt-1 bg-surface2/60">
                    {l.backfilled ? (
                      <p className="text-[12px] text-faint m-0">
                        Resum reconstruït dels registres antics (sense detall d'àpats). Els dies nous es guarden complets.
                      </p>
                    ) : (
                      <>
                        {l.meals.map((m) => {
                          const st = STATUS_LABEL[m.status] ?? STATUS_LABEL.pending;
                          return (
                            <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                              <div className="min-w-0 text-[12.5px]">
                                <span className="text-faint font-semibold capitalize">{m.slot}</span>{' '}
                                <span className="font-semibold truncate">{m.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {m.kcal > 0 && <span className="text-[11.5px] text-muted tnum">{m.kcal} kcal · {m.protein} g</span>}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                              </div>
                            </div>
                          );
                        })}
                        {l.extras.map((e, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 py-1">
                            <div className="min-w-0 text-[12.5px]">
                              <span className="text-faint font-semibold">extra</span>{' '}
                              <span className="font-semibold truncate">{e.name}</span>
                            </div>
                            <span className="text-[11.5px] text-muted tnum shrink-0">{e.kcal} kcal · {e.protein} g</span>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11.5px] text-muted font-semibold">
                          <span>{l.training.plannedLabel ?? 'Sense pla'}{l.training.done ? ' · fet ✓' : ''}</span>
                          <span>Creatina {l.supplements.creatine ? '✓' : '—'}</span>
                          {l.supplements.anabolicMaster && <span>Anabolic ✓</span>}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
        <p className="text-[11.5px] text-faint m-0 mt-2.5">
          Dades orientatives segons registres manuals i estimacions (la precisió s'indica a cada àpat). Avui es guarda automàticament a mitjanit.
        </p>
      </Card>
    </>
  );
}
