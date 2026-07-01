import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import type { CheckIn } from '../../types';

type Mood = CheckIn['mood'];
type App = CheckIn['appetite'];
type En = CheckIn['energy'];

function Chips<T extends string>({ options, value, onPick }: { options: [T, string][]; value: T | null; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5 mt-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onPick(v)}
          className={`rounded-full px-4 py-2.5 font-semibold text-[14px] border transition-colors ${
            value === v ? 'bg-accent text-white border-accent' : 'border-line2 hover:border-faint'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function CheckinSheet() {
  const { submitCheckin, closeSheet } = useApp();
  const [mood, setMood] = useState<Mood | null>(null);
  const [appetite, setApp] = useState<App | null>(null);
  const [energy, setEn] = useState<En | null>(null);

  const submit = () => {
    submitCheckin({
      mood: mood ?? 'be',
      appetite: appetite ?? 'norm',
      energy: energy ?? 'mid',
    });
    closeSheet();
  };

  return (
    <div>
      <SheetHeader title="Check-in ràpid" sub="Tres tocs i llest" />
      <p className="text-[13.5px] font-bold mt-4">Com estàs d'ànim?</p>
      <Chips options={[['be', 'Bé'], ['reg', 'Regular'], ['low', 'Baix']]} value={mood} onPick={setMood} />
      <p className="text-[13.5px] font-bold mt-4">Com tens la gana?</p>
      <Chips options={[['alta', 'Amb gana'], ['norm', 'Normal'], ['poca', 'Poca']]} value={appetite} onPick={setApp} />
      <p className="text-[13.5px] font-bold mt-4">Energia?</p>
      <Chips options={[['ple', 'Plena'], ['mid', 'Mitja'], ['low', 'Baixa']]} value={energy} onPick={setEn} />
      <Button variant="primary" className="w-full mt-[18px]" onClick={submit}>Desar check-in</Button>
    </div>
  );
}
