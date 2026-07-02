/* Supabase (opcional) — helper lleuger SENSE dependència ni SDK.
   Preparat per a quan es vulgui persistir/llegir amb RLS. De moment només
   comprova configuració i exposa un fetch REST mínim. Si no està configurat,
   tot és no-op i l'app segueix amb localStorage/base local.

   IMPORTANT: al frontend NOMÉS s'usa l'ANON key (mai la service_role). */

const env = import.meta.env as Record<string, string | undefined>;

const URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;

/** Hi ha Supabase configurat al frontend? */
export function isSupabaseConfigured(): boolean {
  return !!(URL && ANON);
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
