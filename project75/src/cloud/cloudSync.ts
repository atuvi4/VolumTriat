/* Cloud Sync v1 — servei (sense React).
   Auth per magic link (email, sense contrasenya) + una fila d'estat per usuari
   a la taula `project75_states`. Tota funció és no-op segura si no hi ha
   Supabase configurat: retorna null / no fa res, i l'app segueix en local. */

import type { AppState } from '../types';
import type { CloudProfile } from './cloudTypes';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const TABLE = 'project75_states';

/** Cloud disponible en aquest entorn? (env vars + client creable). */
export function isCloudConfigured(): boolean {
  return isSupabaseConfigured() && !!getSupabaseClient();
}

function toProfile(u: { id: string; email?: string }): CloudProfile {
  return { userId: u.id, email: u.email ?? '', lastSyncedAt: null };
}

/** Usuari de la sessió actual (o null). */
export async function getCurrentUser(): Promise<CloudProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? toProfile(u) : null;
}

/** Escolta canvis de sessió (login via magic link, logout). Retorna unsubscribe. */
export function onAuthChange(cb: (user: CloudProfile | null) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    cb(u ? toProfile(u) : null);
  });
  return () => data.subscription.unsubscribe();
}

/** Envia un enllaç d'accés (magic link) a l'email. Alternativa opcional; per
 *  defecte l'app fa servir email + contrasenya (no depèn de cap correu). */
export async function signInWithEmail(email: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Cloud no configurat');
  const emailRedirectTo =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined;
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo } });
  if (error) throw error;
}

/** Login amb email + contrasenya (compte existent). Llança si falla. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Cloud no configurat');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Crea compte amb email + contrasenya. Si Supabase té «Confirm email»
 *  desactivat, retorna sessió immediata (session != null). */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ session: unknown | null }> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Cloud no configurat');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return { session: data.session };
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.signOut();
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

export interface CloudLoad {
  state: AppState;
  updatedAt: string;
}

/** Carrega l'estat complet del núvol per a l'usuari actual (o null si no n'hi ha). */
export async function loadCloudState(): Promise<CloudLoad | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await sb
    .from(TABLE)
    .select('app_state, updated_at')
    .eq('user_id', uid)
    .maybeSingle();
  if (error || !data) return null;
  return { state: data.app_state as AppState, updatedAt: data.updated_at as string };
}

/** Només la marca de temps del núvol (barat, per comparar sense baixar tot l'estat). */
export async function getCloudUpdatedAt(): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await sb
    .from(TABLE)
    .select('updated_at')
    .eq('user_id', uid)
    .maybeSingle();
  if (error || !data) return null;
  return data.updated_at as string;
}

/** Escriu (insert o update) l'estat complet del núvol. Retorna la nova marca. */
export async function upsertCloudState(state: AppState): Promise<string> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Cloud no configurat');
  const uid = await currentUserId();
  if (!uid) throw new Error('Sessió no iniciada');
  const updatedAt = new Date().toISOString();
  const { data, error } = await sb
    .from(TABLE)
    .upsert({ user_id: uid, app_state: state, updated_at: updatedAt }, { onConflict: 'user_id' })
    .select('updated_at')
    .single();
  if (error) throw error;
  return (data?.updated_at as string) ?? updatedAt;
}

/** Àlies semàntic d'upsertCloudState (nom demanat a l'spec). */
export async function saveCloudState(state: AppState): Promise<string> {
  return upsertCloudState(state);
}
