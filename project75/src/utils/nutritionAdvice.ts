import type { AppState } from '../types';
import type { Confidence } from '../nutrition/nutritionTypes';
import { goalsFor, doneKcal, doneProt, statusCounts } from './goals';
import { nf } from './format';

export type AdjustTone = 'accent' | 'warn' | 'info';
export type AdjustPrimary = 'addShake' | 'rescue';

/** Ajust adaptatiu de Nutrició (regles, sense IA).
 *  NO replanifica el menú, NO toca receptes ni compra, NO registra res:
 *  només llegeix el gap real de kcal/proteïna i proposa 1-3 accions simples. */
export interface NutritionAdjust {
  title: string;
  tone: AdjustTone;
  /** Lectura del gap real (kcal i proteïna registrades). */
  read: string;
  /** Context sense culpa (àpat saltat / ració parcial). */
  note?: string;
  /** 1-3 accions simples per compensar. */
  actions: string[];
  /** Botó principal (un toc; afegeix directament o obre un flux). */
  primary?: AdjustPrimary;
  primaryLabel?: string;
  /** Acció secundària opcional (p. ex. obrir rescat per triar). */
  secondary?: AdjustPrimary;
  secondaryLabel?: string;
  confidence: Confidence;
}

const PROT_TEXT = 'iogurt grec, ous, tonyina o un batut proteic';
const PROT_GAP = 20; // g de proteïna a partir dels quals val la pena reforçar

export function nutritionAdjust(state: AppState): NutritionAdjust {
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const left = g.kcal - dk;
  const protLeft = g.prot - dp;
  const c = statusCounts(state.meals);

  const read = `${nf(Math.max(0, dk))} / ${nf(g.kcal)} kcal · ${dp}/${g.prot} g proteïna`;

  const ctxNote =
    c.skipped > 0
      ? 'Has saltat un àpat — no compensis amb un plat enorme.'
      : c.partial > 0
        ? 'Has fet una ració parcial — completa-la amb calories fàcils, sense presses.'
        : undefined;

  // A. Calories cobertes → mai recomanar menjar extra per calories.
  if (left <= 0) {
    if (protLeft >= 15) {
      return {
        title: 'Ajust per arribar avui',
        tone: 'info',
        read,
        note: 'Calories cobertes: no cal menjar més.',
        actions: [`Tanca només la proteïna: ${PROT_TEXT} (~${protLeft} g).`],
        confidence: 'medium',
      };
    }
    return {
      title: 'Objectiu del dia cobert',
      tone: 'accent',
      read,
      actions: ['Res a compensar. Vigila la digestió i descansa bé.'],
      confidence: 'medium',
    };
  }

  // B. Gap petit (<300 kcal) → proteïna si cal + un snack mínim.
  if (left < 300) {
    const actions: string[] = [];
    if (protLeft >= PROT_GAP) actions.push(`Prioritza proteïna: ${PROT_TEXT} (~${protLeft} g).`);
    actions.push(`Un snack petit tanca les ~${nf(left)} kcal que falten.`);
    return {
      title: 'Ajust per arribar avui',
      tone: 'accent',
      read,
      note: ctxNote,
      actions: actions.slice(0, 3),
      confidence: 'medium',
    };
  }

  // C. Gap real → accions per tram, sense replanificar el menú.
  // El botó principal sempre afegeix un batut amb un sol toc (mínima fricció).
  const actions: string[] = [];
  let tone: AdjustTone = 'accent';
  let secondary: AdjustPrimary | undefined;
  let secondaryLabel: string | undefined;

  if (left <= 500) {
    // 300-500 kcal
    actions.push('Un snack dens (fruits secs + iogurt grec) o un batut petit.');
  } else if (left <= 900) {
    // 500-900 kcal
    actions.push('Un batut dens: llet + plàtan + civada + crema de cacauet.');
    actions.push('Suma un snack dens (fruits secs, formatge o un entrepà petit).');
  } else {
    // >900 kcal → gap gran: batut d'un toc + rescat com a opció per triar
    tone = 'warn';
    secondary = 'rescue';
    secondaryLabel = 'Obrir rescat';
    actions.push('Un batut dens ara mateix (un toc) i reparteix la resta.');
    actions.push('O obre el rescat per triar entre opcions fàcils.');
  }

  if (protLeft >= PROT_GAP) actions.push(`Reforça proteïna: ${PROT_TEXT} (~${protLeft} g).`);

  return {
    title: 'Ajust per arribar avui',
    tone,
    read,
    note: ctxNote,
    actions: actions.slice(0, 3),
    primary: 'addShake',
    primaryLabel: 'Afegir batut',
    secondary,
    secondaryLabel,
    confidence: left > 900 ? 'medium' : 'high',
  };
}
