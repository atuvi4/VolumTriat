import type { AppState } from '../types';
import { BACKUP_LATEST, BACKUP_PREVIOUS } from './storageKeys';

/* =========================================================
   Data Safety v1 — export/import + backup local (sense backend).
   Objectiu: no perdre registres per deploys, migracions o canvis d'entorn.
   Limitació coneguda: localStorage és per navegador + domini. localhost,
   previews de Vercel, mòbil i altres navegadors tenen dades separades fins
   que activem sincronització (backend). Cap Supabase, cap auth encara.
   ========================================================= */

export const APP_VERSION = '1';

export interface BackupEnvelope {
  savedAt: string; // ISO
  state: AppState;
}

export interface ExportFile {
  app: 'project75';
  appVersion: string;
  exportedAt: string;
  state: AppState;
}

/* ---------- Backups locals ---------- */

/** Còpia «última»: l'estat viu més recent. S'actualitza a cada desada. */
export function writeLocalBackup(state: AppState): void {
  try {
    localStorage.setItem(BACKUP_LATEST, JSON.stringify({ savedAt: new Date().toISOString(), state }));
  } catch {
    /* quota plena o storage no disponible: no bloquejar mai l'app */
  }
}

/** Còpia «anterior»: es fixa a la càrrega, ABANS de migrar, com a xarxa de
 *  seguretat per si una migració/deploy trenca l'estat actual. */
export function writePreviousBackup(state: AppState): void {
  try {
    localStorage.setItem(BACKUP_PREVIOUS, JSON.stringify({ savedAt: new Date().toISOString(), state }));
  } catch {
    /* idem */
  }
}

export function readBackup(which: 'latest' | 'previous'): BackupEnvelope | null {
  try {
    const raw = localStorage.getItem(which === 'latest' ? BACKUP_LATEST : BACKUP_PREVIOUS);
    if (!raw) return null;
    const b = JSON.parse(raw);
    return b && b.state && typeof b.savedAt === 'string' ? (b as BackupEnvelope) : null;
  } catch {
    return null;
  }
}

/* ---------- Export ---------- */

export function buildExport(state: AppState): ExportFile {
  return { app: 'project75', appVersion: APP_VERSION, exportedAt: new Date().toISOString(), state };
}

/** Descarrega un JSON amb tot l'AppState (profile, meals, weights, checkin,
 *  dislikes, outcomes, prepDone, projectStartDate, etc.). Només llegeix dades. */
export function downloadExport(state: AppState): void {
  const blob = new Blob([JSON.stringify(buildExport(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `project75-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Import ---------- */

export interface ImportSummary {
  meals: number;
  weights: number;
  outcomes: number;
  dislikes: number;
  checkin: boolean;
  exportedAt?: string;
}

export interface ImportResult {
  state: AppState;
  summary: ImportSummary;
}

/** Heurística: sembla un estat de Project75? (prou camps clau). */
export function looksLikeProject75State(s: unknown): s is AppState {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  return !!o.profile && ('weights' in o || 'meals' in o || 'outcomes' in o);
}

/** Parseja i valida un fitxer d'import. Accepta {app,state} o un AppState directe
 *  (versions anteriors). Llança Error amb missatge clar si no és vàlid. */
export function parseImportFile(text: string): ImportResult {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('El fitxer no és un JSON vàlid.');
  }
  const container = obj as { state?: unknown; exportedAt?: string };
  const state = (container && typeof container === 'object' && 'state' in container ? container.state : obj) as unknown;
  if (!looksLikeProject75State(state)) throw new Error('Això no sembla un backup de Project75.');
  const st = state as AppState;
  const summary: ImportSummary = {
    meals: Array.isArray(st.meals) ? st.meals.filter((m) => m && !m.isExtra).length : 0,
    weights: Array.isArray(st.weights) ? st.weights.length : 0,
    outcomes: Array.isArray(st.outcomes) ? st.outcomes.length : 0,
    dislikes: Array.isArray(st.dislikes) ? st.dislikes.length : 0,
    checkin: !!st.checkin,
    exportedAt: container?.exportedAt,
  };
  return { state: st, summary };
}
