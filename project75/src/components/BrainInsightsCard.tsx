import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Icon from './Icon';
import { brainInsights, exportBrainData, MIN_OUTCOMES_FOR_INSIGHTS } from '../brain/brain';

/** Project75 Brain v1 — insights derivats de l'ús real (local).
 *  Es mostra SEMPRE (buit / recollint / amb patrons). Mai insights inventats. */
export default function BrainInsightsCard() {
  const { state } = useApp();
  const count = state.outcomes?.length ?? 0;
  const insights = brainInsights(state); // [] si encara no hi ha prou dades

  const handleExport = () => {
    const data = exportBrainData(state);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project75-brain-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Estat 1: cap dada · Estat 2: poques dades (< mínim) · Estat 3: prou dades
  const stage = count === 0 ? 'empty' : count < MIN_OUTCOMES_FOR_INSIGHTS ? 'collecting' : 'ready';

  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Aprenentatge Project75</div>
      <Card>
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-bold text-[13.5px] text-accent-strong">
            <Icon name="coach" size={16} /> Aprenentatge Project75
            <span className="ml-auto text-[11px] font-semibold text-muted">{count} accions</span>
            <Icon name="chev" size={14} className="text-muted" />
          </summary>

          {stage === 'empty' && (
            <div className="mt-2.5">
              <p className="text-[13.5px] leading-relaxed m-0">
                Encara no hi ha dades. Quan registris àpats, canvis, extres i ajustos, Project75 començarà a detectar patrons.
              </p>
              <p className="text-[12px] text-faint mt-2 mb-0">0 accions registrades · tot en local, res inventat.</p>
            </div>
          )}

          {stage === 'collecting' && (
            <div className="mt-2.5">
              <div className="font-semibold text-[13.5px]">Dades inicials recollides</div>
              <p className="text-[13.5px] leading-relaxed mt-1 mb-0">
                {count} {count === 1 ? 'acció registrada' : 'accions registrades'}. Encara falten unes quantes accions per
                detectar patrons fiables.
              </p>
              <p className="text-[12px] text-faint mt-2 mb-0">
                Objectiu: {MIN_OUTCOMES_FOR_INSIGHTS} accions per als primers insights. No traiem conclusions abans d'hora.
              </p>
            </div>
          )}

          {stage === 'ready' && (
            <div className="mt-2.5">
              {insights.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {insights.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13.5px] leading-snug">
                      <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-accent shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13.5px] leading-relaxed m-0">
                  Ja hi ha {count} accions, però encara no apareix cap patró prou clar. Segueix registrant i sortiran sols.
                </p>
              )}

              <button
                onClick={handleExport}
                className="mt-3 inline-flex items-center gap-2 bg-surface2 border border-line2 text-ink font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:border-faint"
              >
                <Icon name="database" size={15} /> Exporta dades d'aprenentatge
              </button>
            </div>
          )}

          <p className="text-[12px] text-faint mt-2.5 mb-0">
            Basat només en el teu ús real, en local. Cap dada nutricional inventada. Preparat per, més endavant,
            alimentar un model propi.
          </p>
        </details>
      </Card>
    </div>
  );
}
