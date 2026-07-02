/** Mode visita / només lectura, activat per query param a la URL:
 *  ?demo=1 · ?readonly=1 · ?view=demo
 *  No es persisteix: només afecta qui obre la URL amb el paràmetre. */
export function detectReadOnly(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('demo') === '1' || p.get('readonly') === '1' || p.get('view') === 'demo';
  } catch {
    return false;
  }
}
