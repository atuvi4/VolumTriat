import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { ProjectUser } from './authTypes';

export function isAuthConfigured(): boolean {
  return isSupabaseConfigured() && !!getSupabaseClient();
}

function toUser(u: { id: string; email?: string }): ProjectUser {
  return { id: u.id, email: u.email ?? null };
}

export async function getCurrentUser(): Promise<ProjectUser | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? toUser(u) : null;
}

export function onAuthStateChange(cb: (u: ProjectUser | null) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    cb(u ? toUser(u) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Auth no configurat');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ session: unknown | null }> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Auth no configurat');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return { session: data.session };
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.signOut();
}
