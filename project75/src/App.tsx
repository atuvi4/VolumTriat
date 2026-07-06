import { AppProvider, useApp } from './hooks/useAppState';
import { useAuth } from './auth/useAuth';
import { detectReadOnly } from './utils/readOnly';
import AuthGate from './auth/AuthGate';
import AppLayout from './components/AppLayout';
import Today from './pages/Today';
import Nutrition from './pages/Nutrition';
import Training from './pages/Training';
import Evolution from './pages/Evolution';
import Coach from './pages/Coach';
import Settings from './pages/Settings';
import type { Tab } from './types';

const PAGES: Record<Tab, JSX.Element> = {
  avui: <Today />,
  nutri: <Nutrition />,
  gym: <Training />,
  evo: <Evolution />,
  coach: <Coach />,
  config: <Settings />,
};

function Shell() {
  const { tab } = useApp();
  return <AppLayout>{PAGES[tab]}</AppLayout>;
}

export default function App() {
  const { status, user } = useAuth();
  const demo = detectReadOnly();

  // Mode demo o Supabase no configurat → app local/demo com sempre.
  if (demo || status === 'disabled') {
    return (
      <AppProvider>
        <Shell />
      </AppProvider>
    );
  }
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-muted">Carregant…</div>;
  }
  if (status === 'signed_out' || status === 'error' || !user) {
    return <AuthGate />;
  }
  // signed_in → estat per usuari, remuntat per key.
  return (
    <AppProvider key={user.id}>
      <Shell />
    </AppProvider>
  );
}
