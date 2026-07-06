/* Cloud Sync v1 — tipus compartits.
   Capa fina sobre Supabase Auth + una taula d'estat per usuari. localStorage
   segueix sent la font immediata; el núvol és sincronització i backup remot. */

export type CloudStatus =
  | 'disabled' // no hi ha env vars → cloud desactivat, app en local
  | 'signed_out' // configurat però sense sessió
  | 'signed_in' // sessió activa
  | 'syncing' // operació en curs (login, push, pull, check)
  | 'synced' // última operació OK
  | 'error'; // última operació ha fallat

export interface CloudProfile {
  userId: string;
  email: string;
  /** Última sincronització reconciliada en aquest dispositiu (ISO) o null. */
  lastSyncedAt: string | null;
}
