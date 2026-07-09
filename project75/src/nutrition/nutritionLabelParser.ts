/* =========================================================
   Nutrition Label Parser v1 — llegeix el TEXT d'una etiqueta nutricional
   (català / castellà / anglès) i n'extreu kcal, proteïna, hidrats, greixos,
   base (per 100 g / 100 ml / ració) i grams de ració si hi són.

   PRINCIPI: mai inventar. Si un camp no es llegeix amb claredat, queda
   buit i s'afegeix un warning. La confiança mai és 'high': això només
   ho pot donar l'usuari confirmant manualment els números.

   V1 sense OCR automàtic (seria ~15 MB de models al navegador): el text
   arriba enganxat (Live Text/Lens del mòbil) o escrit. Un OCR V2 només
   ha d'endollar el seu text aquí.
   ========================================================= */

export interface ParsedNutritionLabel {
  basis: 'per100g' | 'per100ml' | 'perServing' | 'unknown';
  servingGrams?: number;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  warnings: string[];
  /** Mai 'high': la confiança alta només la dona la revisió manual. */
  confidence: 'low' | 'medium';
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');

/** Normalitza un número d'etiqueta: "12,5" → 12.5 · "1.234,5" → 1234.5 */
export function normalizeLabelNumber(v: string): number {
  const s = v.trim();
  if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return parseFloat(s.replace(',', '.'));
}

const NUM = '(\\d{1,4}(?:[.,]\\d{1,2})?)';

/** Primer número (amb «g» opcional) d'una línia, o null. */
function firstNumber(line: string): number | null {
  const m = line.match(new RegExp(`${NUM}\\s*g?\\b`));
  return m ? normalizeLabelNumber(m[1]) : null;
}

/** Quants números té la línia (per detectar etiquetes de dues columnes). */
function numberCount(line: string): number {
  return (line.match(new RegExp(NUM, 'g')) ?? []).length;
}

/** Detecta la base de la taula i els grams de ració si apareixen. */
export function detectPer100gOrServing(text: string): { basis: ParsedNutritionLabel['basis']; servingGrams?: number } {
  const t = norm(text);
  const serving = t.match(new RegExp(`(?:racio?n?|porcio?n?|serving)\\D{0,12}${NUM}\\s*(?:g|ml)`));
  const servingGrams = serving ? normalizeLabelNumber(serving[1]) : undefined;
  if (/100\s*ml/.test(t)) return { basis: 'per100ml', servingGrams };
  if (/100\s*g/.test(t)) return { basis: 'per100g', servingGrams };
  if (serving || /(racio|racion|porcio|porcion|serving|per unitat|por unidad)/.test(t)) {
    return { basis: 'perServing', servingGrams };
  }
  return { basis: 'unknown', servingGrams };
}

interface FieldDef {
  match: RegExp;
  /** Línies a IGNORAR encara que casin (subcamps: saturades, sucres...). */
  exclude?: RegExp;
}

const FIELDS: Record<'protein' | 'carbs' | 'fat', FieldDef> = {
  protein: { match: /prote[i]n/ }, // proteïna/proteina/protein(s) — ja normalitzat sense accents
  carbs: {
    match: /(hidrats? de carboni|hidratos de carbono|carbohydrate|\bcarbs?\b|glucids)/,
    exclude: /(sucres|azucar|sugars?|midon|almidon|starch|polialcohol)/,
  },
  fat: {
    match: /(grasas?|greixos?|\bfats?\b|lipids|lipidos)/,
    exclude: /(saturad|saturades|saturated|monoinsaturad|poliinsaturad|monounsaturated|polyunsaturated|trans)/,
  },
};

/** Valida valors per 100 g/ml segons llindars fisiològics. Warnings, mai bloqueig. */
export function validateParsedLabel(p: ParsedNutritionLabel): string[] {
  const warnings: string[] = [];
  const per100 = p.basis === 'per100g' || p.basis === 'per100ml';
  if (per100) {
    if (p.kcal != null && p.kcal > 900) warnings.push('Més de 900 kcal per 100 g és molt inusual: revisa l\'etiqueta.');
    if (p.protein != null && p.protein > 95) warnings.push('Més de 95 g de proteïna per 100 g és sospitós: revisa-ho.');
    if (p.fat != null && p.fat > 100) warnings.push('Els greixos per 100 g no poden superar 100 g: revisa-ho.');
    if (p.carbs != null && p.carbs > 100) warnings.push('Els hidrats per 100 g no poden superar 100 g: revisa-ho.');
  }
  // Coherència energia ↔ macros (4/4/9). Diferència gran = possible mala lectura.
  if (p.kcal != null && p.protein != null && p.carbs != null && p.fat != null) {
    const est = p.protein * 4 + p.carbs * 4 + p.fat * 9;
    if (Math.abs(est - p.kcal) > Math.max(80, p.kcal * 0.25)) {
      warnings.push(`Les macros sumen ~${Math.round(est)} kcal però l'etiqueta diu ${Math.round(p.kcal)}: revisa els números.`);
    }
  }
  return warnings;
}

/** Extreu els camps d'una etiqueta en text. Mai inventa: camp il·legible = buit. */
export function parseNutritionLabelText(text: string): ParsedNutritionLabel {
  const lines = text.split(/\n+/).map((l) => norm(l)).filter(Boolean);
  const whole = lines.join('\n');
  const { basis, servingGrams } = detectPer100gOrServing(whole);

  const warnings: string[] = [];
  const out: ParsedNutritionLabel = { basis, servingGrams, warnings, confidence: 'low' };

  // Energia: només kcal explícites (mai confondre amb kJ).
  const kcalMatch = whole.match(new RegExp(`${NUM}\\s*kcal`));
  if (kcalMatch) {
    out.kcal = normalizeLabelNumber(kcalMatch[1]);
  } else {
    const kj = whole.match(new RegExp(`${NUM}\\s*kj`));
    if (kj) {
      out.kcal = Math.round(normalizeLabelNumber(kj[1]) / 4.184);
      warnings.push('Només he trobat kJ: he convertit a kcal (÷4,184). Confirma-ho amb l\'etiqueta.');
    }
  }

  let twoColumns = false;
  for (const [key, def] of Object.entries(FIELDS) as [keyof typeof FIELDS, FieldDef][]) {
    const line = lines.find((l) => def.match.test(l) && !(def.exclude && def.exclude.test(l)));
    if (!line) continue;
    const v = firstNumber(line.replace(def.match, '')); // número després del nom del camp
    if (v != null) {
      out[key] = v;
      if (numberCount(line) >= 2) twoColumns = true;
    }
  }
  if (twoColumns) {
    warnings.push('L\'etiqueta sembla tenir dues columnes (100 g i ració): he agafat la primera. Revisa-ho.');
  }

  const found = [out.kcal, out.protein, out.carbs, out.fat].filter((v) => v != null).length;
  if (found === 0) warnings.push('No he pogut llegir cap valor amb claredat. Introdueix-los a mà mirant la foto.');
  else if (out.kcal == null) warnings.push('No he trobat les kcal: introdueix-les a mà.');
  else if (out.protein == null) warnings.push('No he trobat la proteïna: introdueix-la a mà.');
  if (basis === 'unknown' && found > 0) warnings.push('No sé si els valors són per 100 g o per ració: tria-ho tu.');

  warnings.push(...validateParsedLabel(out));
  // medium NOMÉS amb lectura completa dels 2 camps clau, base clara i cap avís greu.
  out.confidence = out.kcal != null && out.protein != null && basis !== 'unknown' && warnings.length === 0 ? 'medium' : 'low';
  return out;
}
