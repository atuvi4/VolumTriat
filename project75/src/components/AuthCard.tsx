import { useApp } from '../hooks/useAppState';
import { useAuth } from '../auth/useAuth';
import Card from './Card';
import Button from './Button';

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Compte</div>
      <Card className="py-4 space-y-3">{children}</Card>
    </div>
  );
}

export default function AuthCard() {
  const { status, user, signOut } = useAuth();
  const { isReadOnly, cloudStatus, syncNow } = useApp();

  if (status === 'disabled') {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">Compte no configurat en aquest entorn.</p>
        <p className="text-[12px] text-muted m-0">Project75 continua funcionant en mode local.</p>
      </Wrap>
    );
  }
  if (isReadOnly) {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">Compte no disponible en mode visita.</p>
      </Wrap>
    );
  }
  if (!user) {
    // En condicions normals no s'arriba aquí (el gate ho impedeix), però és segur.
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">No has iniciat sessió.</p>
      </Wrap>
    );
  }

  const syncLabel =
    cloudStatus === 'syncing' ? 'Sincronitzant…' : cloudStatus === 'error' ? 'Error de sincronització' : 'Sincronitzat';

  return (
    <Wrap>
      <div>
        <div className="text-[13px] font-semibold">{user.email}</div>
        <div className="text-[12.5px] text-muted mt-0.5">Sessió iniciada · {syncLabel}</div>
      </div>
      <div className="flex flex-wrap gap-2.5 border-t border-line pt-3">
        <Button variant="ghost" size="sm" icon="swap" disabled={cloudStatus === 'syncing'} onClick={syncNow}>
          Sincronitzar ara
        </Button>
        <Button variant="ghost" size="sm" icon="x" onClick={signOut}>
          Tancar sessió
        </Button>
      </div>
      <p className="text-[12px] text-muted leading-relaxed m-0 border-t border-line pt-3">
        Les teves dades se sincronitzen automàticament entre els teus dispositius. localStorage continua actiu com a
        backup local.
      </p>
    </Wrap>
  );
}
