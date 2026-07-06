import { describe, expect, it } from 'vitest';
import { STATE_KEY_LEGACY, stateKeyFor, cloudLastSyncedKeyFor } from './storageKeys';

describe('stateKeyFor', () => {
  it('usa la clau legacy quan no hi ha usuari', () => {
    expect(stateKeyFor(null)).toBe(STATE_KEY_LEGACY);
  });
  it('namespaça la clau per userId', () => {
    expect(stateKeyFor('u1')).toBe('project75_state_v3::u1');
  });
  it('namespaça la clau de last-synced per userId', () => {
    expect(cloudLastSyncedKeyFor('u1')).toBe('project75_cloud_last_synced::u1');
    expect(cloudLastSyncedKeyFor(null)).toBe('project75_cloud_last_synced');
  });
});
