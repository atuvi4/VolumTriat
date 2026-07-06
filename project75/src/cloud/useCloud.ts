/* Cloud Sync v1 — hook d'integració (sincronització AUTOMÀTICA).
   Aïlla tota la lògica cloud perquè useAppState hi toqui el mínim. Exposa un
   slice (status, user, updatedAt, hasNewer) i accions (signIn/out, push, pull,
   syncNow). Comportament:
   - Auto-PUSH: cada canvi d'estat local es puja al núvol (amb debounce).
   - Auto-PULL: en iniciar sessió i en tornar a l'app (focus/visibilitat), si el
     núvol té dades més recents que l'última sincronització, es baixen soles.
   Seguretat: localStorage segueix sent la font immediata; abans de substituir
   l'estat local per un de remot, importState desa un backup local. Model
   last-writer-wins per marca de temps (suficient per a un usuari amb PC+mòbil). */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import type { CloudProfile, CloudStatus } from './cloudTypes';
import {
  getCloudUpdatedAt,
  getCurrentUser,
  isCloudConfigured,
  loadCloudState,
  onAuthChange,
  signInWithPassword,
  signUpWithPassword,
  signOut as cloudSignOut,
  upsertCloudState,
} from './cloudSync';
import { CLOUD_LAST_SYNCED } from '../utils/storageKeys';

interface Args {
  state: AppState;
  /** Import segur ja existent: desa backup local + normalitza + aplica. */
  importState: (s: AppState) => void;
  isReadOnly: boolean;
  showToast: (m: string) => void;
}

export interface CloudSlice {
  cloudStatus: CloudStatus;
  cloudUser: CloudProfile | null;
  cloudUpdatedAt: string | null;
  /** El núvol té dades més recents que l'última sincronització local. */
  cloudHasNewer: boolean;
  signInCloud: (email: string, password: string) => Promise<void>;
  signOutCloud: () => Promise<void>;
  pushToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const PUSH_DEBOUNCE_MS = 1500;

function readLastSynced(): string | null {
  try {
    return localStorage.getItem(CLOUD_LAST_SYNCED);
  } catch {
    return null;
  }
}
function persistLastSynced(v: string | null): void {
  try {
    if (v) localStorage.setItem(CLOUD_LAST_SYNCED, v);
    else localStorage.removeItem(CLOUD_LAST_SYNCED);
  } catch {
    /* storage no disponible: no bloquejar */
  }
}

export function useCloud({ state, importState, isReadOnly, showToast }: Args): CloudSlice {
  const configured = isCloudConfigured();
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(configured ? 'signed_out' : 'disabled');
  const [cloudUser, setCloudUser] = useState<CloudProfile | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [cloudHasNewer, setCloudHasNewer] = useState(false);

  const lastSynced = useRef<string | null>(readLastSynced());
  const stateRef = useRef(state);
  stateRef.current = state;
  // Gats de control per a l'automatisme:
  const ready = useRef(false); // true quan la reconciliació inicial ha acabat
  const suppressPush = useRef(false); // evita re-pujar l'estat que acabem de baixar

  const setSynced = useCallback((v: string | null) => {
    lastSynced.current = v;
    persistLastSynced(v);
    setCloudUser((u) => (u ? { ...u, lastSyncedAt: v } : u));
  }, []);

  // ---- Operacions base (silencioses per a l'automatisme, amb toast si manual) ----
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
        if (!res) {
          setCloudStatus('synced');
          return;
        }
        suppressPush.current = true; // el canvi d'estat que ve d'aquí no s'ha de re-pujar
        importState(res.state); // desa backup local + normalitza abans de substituir
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

  // Reconciliació: decideix pujar o baixar segons quina banda és més recent.
  const reconcile = useCallback(
    async (silent: boolean) => {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) return doPush(silent); // núvol buit → sembra amb el local
      if (!lastSynced.current || cu > lastSynced.current) return doPull(silent); // núvol més recent → baixa
      return doPush(silent); // local al dia → assegura que el núvol té l'últim
    },
    [doPush, doPull],
  );

  // Nomes baixa si el núvol és més recent (per a focus/tornada a l'app).
  const pullIfRemoteNewer = useCallback(async () => {
    const cu = await getCloudUpdatedAt();
    setCloudUpdatedAt(cu);
    if (cu && (!lastSynced.current || cu > lastSynced.current)) {
      setCloudHasNewer(true);
      await doPull(true);
    }
  }, [doPull]);

  // Reconciliació inicial en iniciar sessió (bloqueja l'auto-push fins acabar).
  const initialReconcile = useCallback(async () => {
    ready.current = false;
    try {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) await doPush(true);
      else if (!lastSynced.current || cu > lastSynced.current) await doPull(true);
      // else: ja estem sincronitzats, res a fer
    } finally {
      ready.current = true;
    }
  }, [doPush, doPull]);

  // ---- Accions públiques (usades per la UI) ----
  const pushToCloud = useCallback(() => doPush(false), [doPush]);
  const pullFromCloud = useCallback(() => doPull(false), [doPull]);

  const syncNow = useCallback(async () => {
    if (!configured) return;
    if (isReadOnly) return showToast('No disponible en mode visita');
    if (!cloudUser) return showToast('Inicia sessió per sincronitzar');
    await reconcile(false);
  }, [configured, isReadOnly, cloudUser, showToast, reconcile]);

  const signInCloud = useCallback(
    async (email: string, password: string) => {
      if (!configured) return;
      if (isReadOnly) return showToast('No disponible en mode visita');
      const e = email.trim();
      if (!e) return showToast('Escriu un email');
      if (!password || password.length < 6) return showToast('La contrasenya ha de tenir 6+ caràcters');
      setCloudStatus('syncing');
      try {
        await signInWithPassword(e, password); // compte existent → login directe
        showToast('Sessió iniciada');
      } catch {
        try {
          const { session } = await signUpWithPassword(e, password); // no existeix → el crea
          if (session) {
            showToast('Compte creat · sessió iniciada');
          } else {
            setCloudStatus('signed_out');
            showToast('Compte creat. Desactiva «Confirm email» a Supabase per entrar sense correu.');
          }
        } catch (err2) {
          setCloudStatus('error');
          const msg = err2 instanceof Error ? err2.message : '';
          showToast(
            /registered/i.test(msg)
              ? 'Aquest email ja existeix · contrasenya incorrecta'
              : msg
                ? `Error: ${msg}`
                : 'No s’ha pogut iniciar sessió',
          );
        }
      }
    },
    [configured, isReadOnly, showToast],
  );

  const signOutCloud = useCallback(async () => {
    if (!configured) return;
    await cloudSignOut();
    ready.current = false;
    setCloudUser(null);
    setCloudUpdatedAt(null);
    setCloudHasNewer(false);
    setCloudStatus('signed_out');
    showToast('Sessió tancada');
  }, [configured, showToast]);

  // ---- Sessió inicial + escolta d'auth ----
  useEffect(() => {
    if (!configured) return;
    let active = true;
    getCurrentUser().then((u) => {
      if (!active || !u) return;
      setCloudUser({ ...u, lastSyncedAt: lastSynced.current });
      setCloudStatus('signed_in');
      void initialReconcile();
    });
    const unsub = onAuthChange((u) => {
      if (u) {
        setCloudUser({ ...u, lastSyncedAt: lastSynced.current });
        setCloudStatus('signed_in');
        void initialReconcile();
      } else {
        ready.current = false;
        setCloudUser(null);
        setCloudStatus('signed_out');
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [configured, initialReconcile]);

  // ---- Auto-PUSH: cada canvi d'estat local es puja (amb debounce) ----
  useEffect(() => {
    if (!configured || isReadOnly || !cloudUser) return;
    if (!ready.current) return; // espera la reconciliació inicial
    if (suppressPush.current) {
      suppressPush.current = false; // aquest canvi ve d'un pull: no re-pujar
      return;
    }
    const t = window.setTimeout(() => void doPush(true), PUSH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, configured, isReadOnly, cloudUser, doPush]);

  // ---- Auto-PULL: en tornar a l'app, baixa si el núvol és més recent ----
  useEffect(() => {
    if (!configured || isReadOnly || !cloudUser) return;
    const onBack = () => {
      if (document.visibilityState === 'visible') void pullIfRemoteNewer();
    };
    window.addEventListener('focus', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
      window.removeEventListener('focus', onBack);
      document.removeEventListener('visibilitychange', onBack);
    };
  }, [configured, isReadOnly, cloudUser, pullIfRemoteNewer]);

  return {
    cloudStatus,
    cloudUser,
    cloudUpdatedAt,
    cloudHasNewer,
    signInCloud,
    signOutCloud,
    pushToCloud,
    pullFromCloud,
    syncNow,
  };
}
