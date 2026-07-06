import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import Button from '../components/Button';
import BrainInsightsCard from '../components/BrainInsightsCard';
import FoodSearchProCard from '../components/FoodSearchProCard';
import DataSafetyCard from '../components/DataSafetyCard';
import CloudSyncCard from '../components/CloudSyncCard';
import { currentWeight } from '../utils/goals';
import type { Ritme } from '../types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-3.5 border-t border-line first:border-t-0">
      <span className="font-semibold text-[14.5px]">{label}</span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">{title}</div>
      <Card className="py-1">{children}</Card>
    </div>
  );
}

const inputCls =
  'w-[120px] text-right bg-surface2 border border-line2 rounded-[10px] px-3 py-2 text-[14px] font-semibold focus:outline-none focus:border-accent';

export default function Settings() {
  const { state, updateProfile, addWeight, resetAll, startToday } = useApp();
  const p = state.profile;
  const [name, setName] = useState(p.name);
  const [startDate, setStartDate] = useState(p.projectStartDate);
  const [age, setAge] = useState(p.age);
  const [heightCm, setHeight] = useState(p.heightCm);
  const [startWeight, setStart] = useState(p.startWeight);
  const [current, setCurrent] = useState<number | ''>(state.weights.length ? currentWeight(state.weights) : '');
  const [target1, setT1] = useState(p.target1);
  const [target2, setT2] = useState(p.target2);
  const [kcalGoal, setKcal] = useState(p.kcalGoal);
  const [protGoal, setProt] = useState(p.protGoal);
  const [ritme, setRitme] = useState<Ritme>(p.ritme);

  const save = () => {
    updateProfile({ name, age, heightCm, startWeight, target1, target2, kcalGoal, protGoal, ritme, projectStartDate: startDate });
    // Només registra pes actual si és un valor real i diferent de l'últim registrat (mai 0).
    if (typeof current === 'number' && current > 0 && current !== currentWeight(state.weights)) addWeight(current);
  };

  return (
    <section>
      <PageHead title="Configuració" sub="Project75 · V1" />

      <Group title="Perfil">
        <Field label="Nom">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Edat">
          <input type="number" className={inputCls} value={age} onChange={(e) => setAge(+e.target.value)} />
        </Field>
        <Field label="Alçada (cm)">
          <input type="number" className={inputCls} value={heightCm} onChange={(e) => setHeight(+e.target.value)} />
        </Field>
      </Group>

      <Group title="Projecte">
        <Field label="Data d'inici del projecte">
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <div className="flex gap-2.5 py-3">
          <Button variant="ghost" size="sm" icon="check" onClick={startToday}>Començar avui</Button>
          <Button
            variant="ghost"
            size="sm"
            icon="alert"
            onClick={() => {
              if (
                confirm(
                  "Això esborrarà les dades locals d'aquest navegador. Se'n desa un backup automàtic (restaurable a «Seguretat de dades»). Continuar?",
                )
              )
                resetAll();
            }}
          >
            Reiniciar projecte
          </Button>
        </div>
        <p className="text-[12.5px] text-muted pb-3 m-0">
          Les ratxes i la tendència només compten des de la data d'inici. Recorda desar els canvis a sota.
        </p>
      </Group>

      <Group title="Objectiu corporal">
        <Field label="Pes inicial (kg)">
          <input type="number" step="0.1" className={inputCls} value={startWeight} onChange={(e) => setStart(+e.target.value)} />
        </Field>
        <Field label="Pes actual (kg)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            placeholder="No registrat"
            value={current}
            onChange={(e) => setCurrent(e.target.value === '' ? '' : +e.target.value)}
          />
        </Field>
        <Field label="Objectiu primer (kg)">
          <input type="number" step="0.5" className={inputCls} value={target1} onChange={(e) => setT1(+e.target.value)} />
        </Field>
        <Field label="Objectiu llarg (kg)">
          <input type="number" step="0.5" className={inputCls} value={target2} onChange={(e) => setT2(+e.target.value)} />
        </Field>
        <Field label="Ritme">
          <span className="inline-flex bg-[#EDEFF2] rounded-[10px] p-[3px]">
            {(['moderat', 'agressiu'] as Ritme[]).map((r) => (
              <button
                key={r}
                onClick={() => setRitme(r)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold capitalize ${ritme === r ? 'bg-white shadow-card' : 'text-muted'}`}
              >
                {r === 'agressiu' ? 'Agressiu' : 'Moderat'}
              </button>
            ))}
          </span>
        </Field>
      </Group>

      <Group title="Nutrició">
        <Field label="Calories objectiu (kcal)">
          <input type="number" step="50" className={inputCls} value={kcalGoal} onChange={(e) => setKcal(+e.target.value)} />
        </Field>
        <Field label="Proteïna objectiu (g)">
          <input type="number" step="5" className={inputCls} value={protGoal} onChange={(e) => setProt(+e.target.value)} />
        </Field>
      </Group>

      <div className="flex gap-2.5 mb-6">
        <Button variant="primary" className="flex-1" icon="check" onClick={save}>Desar canvis</Button>
      </div>

      <FoodSearchProCard />

      <BrainInsightsCard />

      <CloudSyncCard />

      <DataSafetyCard />

      <p className="text-[13px] text-muted text-center">Dades desades localment al navegador (localStorage)</p>
    </section>
  );
}
