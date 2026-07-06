import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import type { ProjectUser } from '../auth/authTypes';
import type { CloudStatus } from './cloudTypes';
import {
  getCloudUpdatedAt,
  isCloudConfigured,
  loadCloudState,
  upsertCloudState,
} from './cloudSync';
import { cloudLastSyncedKeyFor } from '../utils/storageKeys';

interface Args {
  state: AppState;
  importState: (s: AppState) => void;
  isReadOnly: boolean;
  showToast: (m: string) => void;
  user: ProjectUser | null;
}

export interface CloudSlice {
  cloudStatus: CloudStatus;
  cloudUpdatedAt: string | null;
  cloudHasNewer: boolean;
  pushToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const PUSH_DEBOUNCE_MS = 1500;

export function useCloud({ state, importState, isReadOnly, showToast, user }: Args): CloudSlice {
  const configured = isCloudConfigured();
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(configured ? 'signed_out' : 'disabled');
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [cloudHasNewer, setCloudHasNewer] = useState(false);

  const syncedKey = cloudLastSyncedKeyFor(user?.id ?? null);
  const lastSynced = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const ready = useRef(false);
  const suppressPush = useRef(false);

  // Carrega lastSynced de la clau de l'usuari actual quan canvia d'usuari.
  useEffect(() => {
    try {
      lastSynced.current = localStorage.getItem(syncedKey);
    } catch {
      lastSynced.current = null;
    }
  }, [syncedKey]);

  const setSynced = useCallback(
    (v: string | null) => {
      lastSynced.current = v;
      try {
        if (v) localStorage.setItem(syncedKey, v);
        else localStorage.removeItem(syncedKey);
      } catch {
        /* no bloquejar */
      }
    },
    [syncedKey],
  );

  const doPush = useCallback(
    async (silent: boolean) => {
      if (isReadOnly) return;
      setCloudStatus('syncing');
      try {
        const updatedAt = await upsertCloudState(stateRef.current);
        setSynced(updatedAt);
        setCloudUpdatedAt(updatedAt);
        setCloudHasNewer(false);
        setCloudStatus('synced');
        if (!silent) showToast('Aquest dispositiu s’ha pujat al núvol');
      } catch {
        setCloudStatus('error');
        if (!silent) showToast('No s’ha pogut pujar al núvol');
      }
    },
    [isReadOnly, setSynced, showToast],
  );

  const doPull = useCallback(
    async (silent: boolean) => {
      if (isReadOnly) return;
      setCloudStatus('syncing');
      try {
        const res = await loadCloudState();
        if (!res) { setCloudStatus('synced'); return; }
        suppressPush.current = true;
        importState(res.state);
        setSynced(res.updatedAt);
        setCloudUpdatedAt(res.updatedAt);
        setCloudHasNewer(false);
        setCloudStatus('synced');
        if (!silent) showToast('Dades carregades del núvol');
      } catch {
        setCloudStatus('error');
        if (!silent) showToast('No s’han pogut carregar les dades del núvol');
      }
    },
    [isReadOnly, importState, setSynced],
  );

  const reconcile = useCallback(
    async (silent: boolean) => {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) return doPush(silent);
      if (!lastSynced.current || cu > lastSynced.current) return doPull(silent);
      return doPush(silent);
    },
    [doPush, doPull],
  );

  const pullIfRemoteNewer = useCallback(async () => {
    const cu = await getCloudUpdatedAt();
    setCloudUpdatedAt(cu);
    if (cu && (!lastSynced.current || cu > lastSynced.current)) {
      setCloudHasNewer(true);
      await doPull(true);
    }
  }, [doPull]);

  const initialReconcile = useCallback(async () => {
    ready.current = false;
    try {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) await doPush(true);
      else if (!lastSynced.current || cu > lastSynced.current) await doPull(true);
    } finally {
      ready.current = true;
    }
  }, [doPush, doPull]);

  const pushToCloud = useCallback(() => doPush(false), [doPush]);
  const pullFromCloud = useCallback(() => doPull(false), [doPull]);
  const syncNow = useCallback(async () => {
    if (!configured) return;
    if (isReadOnly) return showToast('No disponible en mode visita');
    if (!user) return showToast('Inicia sessió per sincronitzar');
    await reconcile(false);
  }, [configured, isReadOnly, user, showToast, reconcile]);

  // Reacciona a l'usuari: entra → reconcilia; surt → reset.
  useEffect(() => {
    if (!configured) return;
    if (user) {
      setCloudStatus('signed_in');
      void initialReconcile();
    } else {
      ready.current = false;
      setCloudStatus('signed_out');
      setCloudUpdatedAt(null);
      setCloudHasNewer(false);
    }
  }, [configured, user, initialReconcile]);

  // Auto-push a cada canvi (debounce), un cop feta la reconciliació inicial.
  useEffect(() => {
    if (!configured || isReadOnly || !user) return;
    if (!ready.current) return;
    if (suppressPush.current) { suppressPush.current = false; return; }
    const t = window.setTimeout(() => void doPush(true), PUSH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, configured, isReadOnly, user, doPush]);

  // Auto-pull en tornar a l'app si el núvol és més recent.
  useEffect(() => {
    if (!configured || isReadOnly || !user) return;
    const onBack = () => {
      if (document.visibilityState === 'visible') void pullIfRemoteNewer();
    };
    window.addEventListener('focus', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
      window.removeEventListener('focus', onBack);
      document.removeEventListener('visibilitychange', onBack);
    };
  }, [configured, isReadOnly, user, pullIfRemoteNewer]);

  return { cloudStatus, cloudUpdatedAt, cloudHasNewer, pushToCloud, pullFromCloud, syncNow };
}
