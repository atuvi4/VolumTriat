import type { MealSlot } from '../nutrition/nutritionTypes';

/* =========================================================
   Coach Xat v1 — motor d'INTENCIONS local (pur, sense IA de pagament).
   Entén ordres i preguntes en català sobre el dia real de l'usuari i les
   tradueix a accions que ja existeixen a l'app (mai n'inventa de noves).
   PRINCIPI: honestedat — si falta una dada (kcal d'un extra), es demana;
   mai s'inventa. Les respostes les construeix la UI amb l'estat real.
   ========================================================= */

export type ChatIntent =
  | { kind: 'addShake' }
  | { kind: 'markMeal'; slot: MealSlot }
  | { kind: 'skipMeal'; slot: MealSlot }
  | { kind: 'undoMeal'; slot: MealSlot }
  | { kind: 'swapMeal'; slot: MealSlot; query?: string }
  /** «No tinc plàtan (per berenar)»: adaptar l'àpat sense aquest ingredient. */
  | { kind: 'adaptMeal'; missing: string; slot?: MealSlot }
  /** «Tinc iogurt normal, no el proteic»: substituir per la variant real. */
  | { kind: 'substituteIngredient'; have: string; insteadOf?: string; slot?: MealSlot }
  | { kind: 'addExtra'; name: string; kcal?: number; protein?: number }
  | { kind: 'addWeight'; kg: number }
  | { kind: 'hardDay' }
  | { kind: 'lowAppetite' }
  | { kind: 'creatine' }
  | { kind: 'status' }
  | { kind: 'remaining' }
  | { kind: 'nextMeal' }
  | { kind: 'training' }
  | { kind: 'weightTrend' }
  | { kind: 'help' }
  | { kind: 'unknown' };

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(DIACRITICS, '').replace(/\s+/g, ' ').trim();

const SLOT_WORDS: Record<string, MealSlot> = {
  esmorzar: 'esmorzar',
  dinar: 'dinar',
  berenar: 'berenar',
  sopar: 'sopar',
  snack: 'snack',
};

function slotIn(t: string): MealSlot | null {
  // Prefix per cobrir formes verbals: «soparé», «dinarem», «esmorzaré»...
  for (const [w, slot] of Object.entries(SLOT_WORDS)) {
    if (new RegExp(`\\b${w}`).test(t)) return slot;
  }
  return null;
}

const num = (s: string) => parseFloat(s.replace(',', '.'));

/** kcal esmentades al text ("450 kcal", "450 calories"). */
function kcalIn(t: string): number | undefined {
  const m = t.match(/(\d+[.,]?\d*)\s*(kcal|calories|cal)\b/);
  return m ? num(m[1]) : undefined;
}

/** proteïna esmentada ("22 g de proteïna", "22 prot", "proteïna 22"). */
function proteinIn(t: string): number | undefined {
  const before = t.match(/(\d+[.,]?\d*)\s*(g(rams)?\s*)?(de\s*)?prote\w*/);
  if (before) return num(before[1]);
  const after = t.match(/prote\w*\D{0,6}(\d+[.,]?\d*)/);
  return after ? num(after[1]) : undefined;
}

/** Nom de l'extra: el text original sense verbs inicials ni números amb unitat. */
function extraName(raw: string): string {
  const cleaned = raw
    .replace(/^\s*(m['’]he\s+menjat|he\s+menjat|he\s+pres|apunta(['’]m)?|registra(['’]m)?|afegeix(-me)?|suma(['’]m)?)\s*/i, '')
    .replace(/\b\d+[.,]?\d*\s*(kcal|calories|cal|g(rams)?)\b/gi, '')
    .replace(/\b(de\s*)?prote[ïi]na\b/gi, '')
    .replace(/\b(amb|i|de)\s*$/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,·]\s*$/, '')
    .trim();
  if (!cleaned) return 'Extra';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const ACTION_KINDS = new Set([
  'addShake', 'markMeal', 'skipMeal', 'undoMeal', 'swapMeal',
  'addExtra', 'addWeight', 'hardDay', 'lowAppetite', 'creatine',
]);

/** L'intent modifica dades? (per bloquejar-lo en mode visita) */
export function isActionIntent(i: ChatIntent): boolean {
  return ACTION_KINDS.has(i.kind);
}

/** Tradueix un missatge de l'usuari a una intenció. Determinista i testejable. */
export function parseIntent(raw: string): ChatIntent {
  const t = norm(raw);
  if (!t) return { kind: 'unknown' };
  const slot = slotIn(t);

  // Ajuda
  if (/^(ajuda|help)\b/.test(t) || t.includes('que pots fer') || t.includes('que saps fer')) return { kind: 'help' };

  // Pes corporal: "peso 68,4" / "registra 68,4 kg"
  const wKg = t.match(/\b(?:peso|pes(?:o)?(?:\s+de)?|faig)\s+(\d{2,3}[.,]?\d*)\b/) ?? t.match(/\b(\d{2,3}[.,]?\d*)\s*kg\b/);
  if (wKg && !t.includes('kcal')) {
    const kg = num(wKg[1]);
    if (kg >= 30 && kg <= 250) return { kind: 'addWeight', kg };
  }

  // Suplements
  if (t.includes('creatina')) return { kind: 'creatine' };

  // Batut (afegir)
  if (/\bbatut\b/.test(t) && /(afegeix|apunta|posa|registra|suma|vull|fes|dona)/.test(t)) return { kind: 'addShake' };
  if (/^batut$/.test(t)) return { kind: 'addShake' };

  // «No tinc X» → adaptar l'àpat sense aquest ingredient (mai confondre amb la gana)
  const noTinc = t.match(/(?:no (?:tinc|em queda|queda|hi ha)|m['’]?he quedat sense)\s+(?:cap\s+|gens de\s+)?(.+)$/);
  if (noTinc && !/gan[ae]s?\b/.test(noTinc[1])) {
    const missing = noTinc[1]
      .replace(/\bper (?:a )?(?:al |el |l')?(esmorzar|dinar|berenar|sopar|snack)\b.*$/, '')
      .replace(/^(el|la|els|les|un|una)\s+/, '')
      .trim();
    if (missing) return { kind: 'adaptMeal', missing, slot: slot ?? undefined };
  }

  // «Tinc X en lloc de Y» / «tinc X, no el Y» / «només tinc X» → substituir variant
  if (!/gan[ae]s?\b/.test(t)) {
    const cleanIng = (s: string) =>
      s
        .replace(/\bper (?:a )?(?:al |el |l')?(esmorzar|dinar|berenar|sopar|snack)\b.*$/, '')
        .replace(/^(el|la|els|les|un|una)\s+/, '')
        .replace(/[?!.]+$/, '')
        .trim();
    const mLloc = t.match(/\btinc\s+(?:el |la |l')?(.+?)\s+en (?:lloc|comptes) (?:de |del |de la )(.+)$/);
    if (mLloc) return { kind: 'substituteIngredient', have: cleanIng(mLloc[1]), insteadOf: cleanIng(mLloc[2]), slot: slot ?? undefined };
    const mNo = t.match(/(?:^|[^o] )tinc\s+(?:el |la |l')?(.+?),?\s+(?:i no|no)\s+(?:el |la |l')?(.+)$/);
    if (mNo) return { kind: 'substituteIngredient', have: cleanIng(mNo[1]), insteadOf: cleanIng(mNo[2]), slot: slot ?? undefined };
    const mNomes = t.match(/\bnomes tinc\s+(?:el |la |l')?(.+)$/);
    if (mNomes) return { kind: 'substituteIngredient', have: cleanIng(mNomes[1]), slot: slot ?? undefined };
  }

  // Canviar un àpat (amb "per X" opcional)
  if (slot && /(canvia|cambia|substitueix|alternativ|una altra opcio)/.test(t)) {
    const per = t.match(/\bper\s+(.+)$/);
    return { kind: 'swapMeal', slot, query: per ? per[1].trim() : undefined };
  }

  // Saltar un àpat
  if (slot && /(salta|saltar|saltare|no (vull|fare|menjare|dinare|sopare|esmorzare|berenare))/.test(t)) {
    return { kind: 'skipMeal', slot };
  }

  // Desfer un àpat
  if (slot && /(desfes|desfer|torna enrere|desmarca)/.test(t)) return { kind: 'undoMeal', slot };

  // Marcar fet un àpat planificat ("he fet el dinar", "dinar fet", "he menjat el sopar")
  if (slot && /(he fet|^fet\b|\bfet\b|\bfeta\b|marca|he menjat|m['’]?he menjat|acabo de)/.test(t)) {
    return { kind: 'markMeal', slot };
  }

  // Extra manual ("he menjat un entrepà de 450 kcal i 22 g de proteïna")
  if (/(he menjat|m['’]?he menjat|he pres|apunta|registra|afegeix|suma)/.test(t) && !slot) {
    return { kind: 'addExtra', name: extraName(raw), kcal: kcalIn(t), protein: proteinIn(t) };
  }

  // Estats del dia
  if (/(dia dificil|estic fatal|mal dia|dia dolent|avui no puc)/.test(t)) return { kind: 'hardDay' };
  if (/gana/.test(t) && /(no|poca|sense|gens)/.test(t)) return { kind: 'lowAppetite' };

  // Preguntes
  if (/(que (em )?toca|que menjo ara|seguent apat|proper apat|ara que)/.test(t)) return { kind: 'nextMeal' };
  if (/(falta|falten|queda|queden)/.test(t)) return { kind: 'remaining' };
  if (/(entreno|entrenament|gym|gimnas|sessio)/.test(t)) return { kind: 'training' };
  if (/(tendencia|com va el pes|pes\b)/.test(t) && !wKg) return { kind: 'weightTrend' };
  if (/(com vaig|com va el dia|com ho porto|resum)/.test(t)) return { kind: 'status' };

  return { kind: 'unknown' };
}

/** Text d'ajuda honest: què entén el xat (i què no és). */
export const HELP_TEXT =
  'Sóc el coach local: funciono amb regles i les teves dades d\'avui, sense IA al núvol. Entenc coses com:\n' +
  '· «Com vaig?» / «Què em toca ara?» / «Què entreno avui?»\n' +
  '· «Afegeix un batut» / «Creatina feta» / «Peso 68,4»\n' +
  '· «He fet el dinar» / «Salta\'m el berenar» / «Canvia\'m el sopar»\n' +
  '· «No tinc plàtan» / «Tinc iogurt normal, no el proteic» → t\'adapto l\'àpat\n' +
  '· «He menjat un entrepà de 450 kcal i 22 g de proteïna»\n' +
  'Mai m\'invento calories: si registres una cosa sense números, te\'ls demanaré.';
