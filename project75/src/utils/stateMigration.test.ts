import { beforeEach, describe, expect, it } from 'vitest';
import { pickInitialRaw, type KVStore } from './stateMigration';
import { STATE_KEY_LEGACY, stateKeyFor } from './storageKeys';

function memStore(seed: Record<string, string> = {}): KVStore & { data: Record<string, string> } {
  const data: Record<string, string> = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

describe('pickInitialRaw', () => {
  it('retorna la clau per usuari si ja existeix', () => {
    const s = memStore({ [stateKeyFor('u1')]: '{"a":1}', [STATE_KEY_LEGACY]: '{"old":1}' });
    expect(pickInitialRaw('u1', s)).toBe('{"a":1}');
  });

  it('migra legacy a la clau d usuari sense esborrar legacy', () => {
    const s = memStore({ [STATE_KEY_LEGACY]: '{"old":1}' });
    const raw = pickInitialRaw('u1', s);
    expect(raw).toBe('{"old":1}');
    expect(s.data[stateKeyFor('u1')]).toBe('{"old":1}'); // copiat
    expect(s.data[STATE_KEY_LEGACY]).toBe('{"old":1}');  // NO esborrat
  });

  it('retorna null per a un usuari nou sense legacy', () => {
    const s = memStore();
    expect(pickInitialRaw('u2', s)).toBeNull();
  });

  it('amb userId null usa la clau legacy', () => {
    const s = memStore({ [STATE_KEY_LEGACY]: '{"demo":1}' });
    expect(pickInitialRaw(null, s)).toBe('{"demo":1}');
  });
});
