import { describe, expect, it } from 'vitest';
import { emptyState, STARTER_PROFILE } from './emptyState';

describe('emptyState', () => {
  it('comença sense historial', () => {
    const s = emptyState();
    expect(s.weights).toEqual([]);
    expect(s.outcomes).toEqual([]);
    expect(s.completedDates).toEqual([]);
    expect(s.streak).toBe(0);
    expect(s.checkin).toBeNull();
  });
  it('té un perfil neutre amb nom buit i objectius > 0', () => {
    expect(STARTER_PROFILE.name).toBe('');
    expect(STARTER_PROFILE.kcalGoal).toBeGreaterThan(0);
    expect(STARTER_PROFILE.protGoal).toBeGreaterThan(0);
  });
});
