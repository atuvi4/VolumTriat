import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => false,
  getSupabaseClient: () => null,
}));

import { isAuthConfigured, getCurrentUser } from './authService';

describe('authService sense client Supabase', () => {
  it('no està configurat quan no hi ha client', () => {
    expect(isAuthConfigured()).toBe(false);
  });
  it('getCurrentUser retorna null sense client', async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
