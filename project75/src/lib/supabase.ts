/* Supabase (opcional) — helper lleuger SENSE dependència ni SDK.
   Preparat per a quan es vulgui persistir/llegir amb RLS. De moment només
   comprova configuració i exposa un fetch REST mínim. Si no està configurat,
   tot és no-op i l'app segueix amb localStorage/base local.

   IMPORTANT: al frontend NOMÉS s'usa l'ANON key (mai la service_role). */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = import.meta.env as Record<string, string | undefined>;

const URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;

/** Hi ha Supabase configurat al frontend? */
export function isSupabaseConfigured(): boolean {
  return !!(URL && ANON);
}

/* ---------- Client SDK (Auth + DB amb RLS) ----------
   Singleton mandrós: només es crea si hi ha env vars. Si no, retorna null i
   tota la capa cloud queda desactivada (l'app segueix amb localStorage). */
let _client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;
  if (!URL || !ANON) {
    _client = null;
    return _client;
  }
  _client = createClient(URL, ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // captura el magic link en tornar a l'app
      storageKey: 'project75_supabase_auth',
    },
  });
  return _client;
}

/** Consulta REST mínima (opcional). Retorna null si no està configurat o falla.
 *  path exemple: 'foods?select=*&limit=10' */
export async function supabaseRest<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  if (!URL || !ANON) return null;
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
