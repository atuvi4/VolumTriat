import { AppProvider, useApp } from './hooks/useAppState';
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
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
