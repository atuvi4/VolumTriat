import { describe, expect, it } from 'vitest';
import { isAuthConfigured, getCurrentUser } from './authService';

describe('authService sense Supabase', () => {
  it('no està configurat sense env vars', () => {
    expect(isAuthConfigured()).toBe(false);
  });
  it('getCurrentUser retorna null sense client', async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
