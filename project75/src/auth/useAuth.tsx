import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthStatus, ProjectUser } from './authTypes';
import {
  getCurrentUser,
  isAuthConfigured,
  onAuthStateChange,
  signInWithPassword,
  signUpWithPassword,
  signOut as svcSignOut,
} from './authService';

interface AuthCtx {
  status: AuthStatus;
  user: ProjectUser | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isAuthConfigured();
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'disabled');
  const [user, setUser] = useState<ProjectUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!configured) return;
    try {
      const u = await getCurrentUser();
      setUser(u);
      setStatus(u ? 'signed_in' : 'signed_out');
    } catch {
      setStatus('error');
      setError('No s’ha pogut comprovar la sessió');
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    void refreshUser();
    const unsub = onAuthStateChange((u) => {
      setUser(u);
      setStatus(u ? 'signed_in' : 'signed_out');
    });
    return unsub;
  }, [configured, refreshUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) return;
      const e = email.trim();
      if (!e) { setError('Escriu un email'); return; }
      if (!password || password.length < 6) { setError('La contrasenya ha de tenir 6+ caràcters'); return; }
      setError(null);
      setStatus('loading');
      try {
        await signInWithPassword(e, password);
        // onAuthStateChange posarà signed_in
      } catch {
        try {
          const { session } = await signUpWithPassword(e, password);
          if (!session) {
            setStatus('signed_out');
            setError('Compte creat. Cal «Confirm email» OFF a Supabase per entrar sense correu.');
          }
        } catch (err2) {
          setStatus('error');
          const msg = err2 instanceof Error ? err2.message : '';
          setError(/registered/i.test(msg) ? 'Aquest email ja existeix · contrasenya incorrecta' : (msg || 'No s’ha pogut iniciar sessió'));
        }
      }
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await svcSignOut();
    setUser(null);
    setStatus('signed_out');
  }, [configured]);

  const value = useMemo<AuthCtx>(
    () => ({ status, user, error, signIn, signOut, refreshUser }),
    [status, user, error, signIn, signOut, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth ha de ser dins d’AuthProvider');
  return ctx;
}
