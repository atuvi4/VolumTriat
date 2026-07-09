import { useRef, useState } from 'react';
import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Button from './Button';
import { downloadExport, lastExportedAt, parseImportFile, readBackup, type BackupEnvelope } from '../utils/dataSafety';

function fmt(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Data Safety v1 — export/import + backup local, sense backend. */
export default function DataSafetyCard() {
  const { state, isReadOnly, importState, resetAll, showToast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  // Es llegeixen un cop al render; n'hi ha prou per mostrar la data.
  const [latest] = useState<BackupEnvelope | null>(() => readBackup('latest'));
  const [previous] = useState<BackupEnvelope | null>(() => readBackup('previous'));
  const [lastExport, setLastExport] = useState<string | null>(() => lastExportedAt());

  const exportDaysAgo = lastExport ? Math.floor((Date.now() - new Date(lastExport).getTime()) / 86400000) : null;
  const exportNote =
    exportDaysAgo == null
      ? 'Encara no has exportat cap còpia fora del navegador.'
      : exportDaysAgo >= 14
        ? `Fa ${exportDaysAgo} dies de l'últim export — toca fer-ne un.`
        : `Últim export: ${exportDaysAgo === 0 ? 'avui' : `fa ${exportDaysAgo} ${exportDaysAgo === 1 ? 'dia' : 'dies'}`}.`;
  const exportStale = exportDaysAgo == null || exportDaysAgo >= 14;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { state: next, summary } = parseImportFile(String(reader.result));
        const ok = window.confirm(
          `S'importaran ${summary.meals} àpats, ${summary.weights} pesos, ${summary.outcomes} registres d'aprenentatge` +
            `${summary.checkin ? ', 1 check-in' : ''} i ${summary.dislikes} preferències.\n\n` +
            "Això SOBREESCRIURÀ les dades d'aquest navegador (se'n desa una còpia abans). Continuar?",
        );
        if (ok) importState(next);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Fitxer no vàlid');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // permet reimportar el mateix fitxer
  };

  const restore = (env: BackupEnvelope | null, label: string) => {
    if (!env) return;
    if (window.confirm(`Restaurar ${label} (${fmt(env.savedAt)})? Se sobreescriuran les dades actuals (se'n desa una còpia abans).`)) {
      importState(env.state);
    }
  };

  const reset = () => {
    if (isReadOnly) {
      showToast('Mode visita: reiniciar està bloquejat.');
      return;
    }
    if (
      window.confirm(
        "Això esborrarà les dades locals d'aquest navegador (àpats, pesos, check-ins, aprenentatge).\n\n" +
          "Se'n desa un backup automàtic abans; el podràs restaurar amb «Restaurar últim backup local». Continuar?",
      )
    ) {
      resetAll();
    }
  };

  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Seguretat de dades</div>
      <Card className="py-4 space-y-3">
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            icon="database"
            onClick={() => {
              downloadExport(state);
              setLastExport(new Date().toISOString());
            }}
          >
            Exportar dades
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="plus"
            disabled={isReadOnly}
            onClick={() => (isReadOnly ? showToast('Mode visita: importar està bloquejat.') : fileRef.current?.click())}
          >
            Importar dades
          </Button>
        </div>
        <p className={`text-[12px] m-0 ${exportStale ? 'text-warn font-semibold' : 'text-muted'}`}>{exportNote}</p>

        <div className="border-t border-line pt-3">
          <div className="text-[13px] font-semibold">Últim backup local</div>
          <div className="text-[12.5px] text-muted mt-0.5">{fmt(latest?.savedAt)}</div>
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Button
              variant="ghost"
              size="sm"
              icon="swap"
              disabled={isReadOnly || !latest}
              onClick={() => restore(latest, "l'últim backup local")}
            >
              Restaurar últim backup local
            </Button>
            {previous && (
              <Button
                variant="ghost"
                size="sm"
                icon="swap"
                disabled={isReadOnly}
                onClick={() => restore(previous, "la còpia anterior (abans de l'última actualització)")}
              >
                Restaurar còpia anterior
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <Button variant="danger" size="sm" icon="alert" disabled={isReadOnly} onClick={reset}>
            Reiniciar projecte
          </Button>
        </div>

        <p className="text-[12px] text-muted leading-relaxed m-0 border-t border-line pt-3">
          Les dades es guarden <b>en aquest navegador i aquest domini</b>. localhost, previews de Vercel, mòbil i
          altres navegadors tenen dades separades fins que activem la sincronització. Exporta de tant en tant per
          tenir una còpia segura.
        </p>
      </Card>
    </div>
  );
}
