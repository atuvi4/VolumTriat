import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import Button from '../components/Button';
import type { Goal, Ritme } from '../types';

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-[border-color,box-shadow]';

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-[3px] bg-seg rounded-[10px] p-[3px] w-full">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-[13px] font-semibold ${
            value === o.v ? 'bg-white shadow-card' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-bold text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export default function Onboarding() {
  const { completeOnboarding } = useApp();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number | ''>('');
  const [heightCm, setHeight] = useState<number | ''>('');
  const [startWeight, setWeight] = useState<number | ''>('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [ritme, setRitme] = useState<Ritme>('moderat');

  const valid =
    typeof age === 'number' && age > 0 &&
    typeof heightCm === 'number' && heightCm > 0 &&
    typeof startWeight === 'number' && startWeight > 0;

  const submit = () => {
    if (!valid) return;
    completeOnboarding({
      name: name.trim() || undefined,
      sex,
      age: age as number,
      heightCm: heightCm as number,
      startWeight: startWeight as number,
      goal,
      ritme,
    });
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-surface overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-6 my-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Configura el teu perfil</h1>
          <p className="text-[13px] text-muted mt-1">
            Amb aquestes dades calculem els teus objectius. Ho podràs canviar més endavant a Configuració.
          </p>
        </div>

        <Field label="Nom (opcional)">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="El teu nom" />
        </Field>

        <Field label="Sexe">
          <Seg
            value={sex}
            onChange={setSex}
            options={[
              { v: 'male', label: 'Home' },
              { v: 'female', label: 'Dona' },
            ]}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Edat">
            <input
              type="number"
              inputMode="numeric"
              className={inputCls}
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : +e.target.value)}
            />
          </Field>
          <Field label="Alçada (cm)">
            <input
              type="number"
              inputMode="numeric"
              className={inputCls}
              value={heightCm}
              onChange={(e) => setHeight(e.target.value === '' ? '' : +e.target.value)}
            />
          </Field>
          <Field label="Pes (kg)">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={inputCls}
              value={startWeight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : +e.target.value)}
            />
          </Field>
        </div>

        <Field label="El teu objectiu">
          <Seg
            value={goal}
            onChange={setGoal}
            options={[
              { v: 'cut', label: 'Perdre greix' },
              { v: 'maintain', label: 'Mantenir' },
              { v: 'bulk', label: 'Volum' },
            ]}
          />
        </Field>

        <Field label="Ritme">
          <Seg
            value={ritme}
            onChange={setRitme}
            options={[
              { v: 'moderat', label: 'Moderat' },
              { v: 'agressiu', label: 'Agressiu' },
            ]}
          />
        </Field>

        <Button variant="primary" icon="check" className="w-full" disabled={!valid} onClick={submit}>
          Comença
        </Button>
        <p className="text-[12px] text-muted leading-relaxed m-0">
          Els objectius de calories i proteïna es calculen amb el teu perfil (estimació). Els pots ajustar quan vulguis.
        </p>
      </div>
    </div>
  );
}
