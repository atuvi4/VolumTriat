import { STATE_KEY_LEGACY, stateKeyFor } from './storageKeys';

export interface KVStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** Marca que la clau legacy d'aquest dispositiu ja ha estat adoptada per un
 *  usuari, perquè cap altre compte nou del mateix navegador no la pugui heretar. */
const LEGACY_CLAIMED_KEY = 'project75_state_v3::__legacy_claimed';

/** Decideix quin JSON cru d'estat carregar per a un usuari.
 *  - Si l'usuari ja té la seva clau, la retorna (i "reclama" el legacy del
 *    dispositiu perquè ningú més l'hereti).
 *  - Si no en té, adopta la clau legacy NOMÉS si encara no l'ha reclamat cap
 *    altre usuari (evita que un compte nou hereti les dades d'un altre al mateix
 *    navegador). La legacy no s'esborra mai.
 *  - Si no hi ha res (o el legacy ja està reclamat per un altre) → null → l'usuari
 *    comença buit (i passarà per l'onboarding). */
export function pickInitialRaw(userId: string | null, store: KVStore): string | null {
  const key = stateKeyFor(userId);
  const own = store.getItem(key);
  if (own !== null) {
    if (userId !== null && store.getItem(LEGACY_CLAIMED_KEY) === null) {
      store.setItem(LEGACY_CLAIMED_KEY, userId); // aquest usuari reclama el legacy del dispositiu
    }
    return own;
  }
  if (userId === null) return null; // key ja és la legacy; si és null, no hi ha res

  const claimed = store.getItem(LEGACY_CLAIMED_KEY);
  const legacy = store.getItem(STATE_KEY_LEGACY);
  if (legacy !== null && (claimed === null || claimed === userId)) {
    store.setItem(key, legacy); // còpia; legacy es manté intacte
    if (claimed === null) store.setItem(LEGACY_CLAIMED_KEY, userId);
    return legacy;
  }
  return null;
}
