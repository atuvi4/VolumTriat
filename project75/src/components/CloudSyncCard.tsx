import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Button from './Button';

function fmt(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Sincronització</div>
      <Card className="py-4 space-y-3">{children}</Card>
    </div>
  );
}

/** Cloud Sync v1 — vincula PC i mòbil amb el mateix email. localStorage segueix
 *  actiu com a backup local; abans de substituir dades, es demana confirmació. */
export default function CloudSyncCard() {
  const { isReadOnly, cloudStatus, cloudUser, cloudHasNewer, signInCloud, signOutCloud, syncNow } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // No configurat en aquest entorn (sense env vars).
  if (cloudStatus === 'disabled') {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">Cloud Sync no està configurat en aquest entorn.</p>
      </Wrap>
    );
  }

  // Mode visita: cap acció de sessió/sync.
  if (isReadOnly) {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">No disponible en mode visita.</p>
      </Wrap>
    );
  }

  const busy = cloudStatus === 'syncing';

  // No connectat: demanar enllaç d'accés per email.
  if (!cloudUser) {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">
          El mòbil i el PC es vinculen quan inicies sessió amb el mateix email i contrasenya.
        </p>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="el-teu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Contrasenya (mín. 6 caràcters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.trim() && password.length >= 6) signInCloud(email, password);
          }}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <Button
          variant="primary"
          size="sm"
          icon="check"
          disabled={busy || !email.trim() || password.length < 6}
          onClick={() => signInCloud(email, password)}
        >
          {busy ? 'Entrant…' : 'Entrar'}
        </Button>
        <p className="text-[12px] text-muted leading-relaxed m-0 border-t border-line pt-3">
          La primera vegada es crea el compte; després entres amb les mateixes dades des de qualsevol dispositiu.
          localStorage continua actiu com a backup local.
        </p>
      </Wrap>
    );
  }

  // Connectat.
  const statusLabel =
    cloudStatus === 'syncing'
      ? 'Sincronitzant…'
      : cloudStatus === 'error'
        ? 'Error de sincronització'
        : 'Sincronitzat';

  return (
    <Wrap>
      <div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${cloudStatus === 'error' ? 'bg-warn' : 'bg-accent'}`} />
          <div className="text-[13px] font-semibold">{cloudUser.email}</div>
        </div>
        <div className="text-[12.5px] text-muted mt-1">
          {statusLabel} · última: {fmt(cloudUser.lastSyncedAt)}
        </div>
      </div>

      {cloudHasNewer && cloudStatus !== 'syncing' && (
        <p className="text-[12.5px] text-info font-semibold m-0">Baixant les dades més recents del núvol…</p>
      )}

      <div className="flex flex-wrap gap-2.5 border-t border-line pt-3">
        <Button variant="ghost" size="sm" icon="swap" disabled={busy} onClick={syncNow}>
          {busy ? 'Sincronitzant…' : 'Sincronitzar ara'}
        </Button>
        <Button variant="ghost" size="sm" icon="x" disabled={busy} onClick={signOutCloud}>
          Tancar sessió
        </Button>
      </div>

      <p className="text-[12px] text-muted leading-relaxed m-0 border-t border-line pt-3">
        La sincronització és <b>automàtica</b>: es puja sola quan canvies alguna cosa i es baixa sola quan obres l’app
        en un altre dispositiu. localStorage continua actiu com a backup local.
      </p>
    </Wrap>
  );
}
