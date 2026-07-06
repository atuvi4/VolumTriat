/** Claus de localStorage centralitzades (per compartir estat i backups). */
export const STATE_KEY = 'project75_state_v3';
/** Clau antiga d'estat (abans del multi-usuari). Base per a la migració. */
export const STATE_KEY_LEGACY = 'project75_state_v3';
export const BACKUP_LATEST = 'project75_backup_latest';
export const BACKUP_PREVIOUS = 'project75_backup_previous';
/** Cloud Sync: última marca del núvol reconciliada en aquest dispositiu (ISO). */
export const CLOUD_LAST_SYNCED = 'project75_cloud_last_synced';

/** Clau d'estat per usuari. Sense usuari (demo/local) → clau legacy. */
export function stateKeyFor(userId: string | null): string {
  return userId ? `project75_state_v3::${userId}` : STATE_KEY_LEGACY;
}

/** Clau de last-synced per usuari. Sense usuari → clau global. */
export function cloudLastSyncedKeyFor(userId: string | null): string {
  return userId ? `project75_cloud_last_synced::${userId}` : CLOUD_LAST_SYNCED;
}
