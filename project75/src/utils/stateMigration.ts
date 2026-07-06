import { STATE_KEY_LEGACY, stateKeyFor } from './storageKeys';

export interface KVStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** Decideix quin JSON cru d'estat carregar per a un usuari, migrant una sola
 *  vegada la clau legacy a la clau per usuari SENSE esborrar la legacy. */
export function pickInitialRaw(userId: string | null, store: KVStore): string | null {
  const key = stateKeyFor(userId);
  const own = store.getItem(key);
  if (own !== null) return own;
  if (userId === null) return null; // key ja és la legacy; si és null, no hi ha res
  const legacy = store.getItem(STATE_KEY_LEGACY);
  if (legacy !== null) {
    store.setItem(key, legacy); // còpia; legacy es manté intacte
    return legacy;
  }
  return null;
}
