import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import { isStarted } from '../../utils/project';

/** En preparació: fixa el pes inicial conegut (perfil), sense crear tendència.
 *  Un cop començat (Dia 1): registra el primer pes real. */
export default function InitialWeightSheet() {
  const { state, updateProfile, addWeight, closeSheet } = useApp();
  const started = isStarted(state.profile.projectStartDate);
  const [kg, setKg] = useState(state.profile.startWeight);

  const save = () => {
    if (started) {
      updateProfile({ startWeight: kg });
      addWeight(kg); // primer registre real
    } else {
      updateProfile({ startWeight: kg }); // només fixa el valor, sense tendència
    }
    closeSheet();
  };

  return (
    <div>
      <SheetHeader
        title={started ? 'Registrar pes del Dia 1' : 'Definir pes inicial'}
        sub={started ? 'Aquest serà el teu primer punt real de tendència.' : 'Guardem el valor conegut. La tendència començarà quan comenci el projecte.'}
      />
      <div className="flex items-center gap-3 mt-3">
        <input
          type="number"
          step="0.1"
          value={kg}
          onChange={(e) => setKg(+e.target.value)}
          className="flex-1 bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[18px] font-bold focus:outline-none focus:border-accent"
        />
        <span className="text-muted font-semibold">kg</span>
      </div>
      <Button variant="primary" className="w-full mt-4" icon="check" onClick={save}>
        {started ? 'Registrar pes' : 'Desar pes inicial'}
      </Button>
    </div>
  );
}
