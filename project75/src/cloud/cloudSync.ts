/* Cloud Sync v1 — servei (sense React).
   Auth per magic link (email, sense contrasenya) + una fila d'estat per usuari
   a la taula `project75_states`. Tota funció és no-op segura si no hi ha
   Supabase configurat: retorna null / no fa res, i l'app segueix en local. */

import type { AppState } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const TABLE = 'project75_states';

/** Cloud disponible en aquest entorn? (env vars + client creable). */
export function isCloudConfigured(): boolean {
  return isSupabaseConfigured() && !!getSupabaseClient();
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
