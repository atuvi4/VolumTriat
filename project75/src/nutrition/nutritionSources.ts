import type { Confidence, NutritionSource, Precision } from './nutritionTypes';

interface SourceMeta {
  label: string;
  short: string;
  description: string;
  url?: string;
}

export const SOURCE_META: Record<NutritionSource, SourceMeta> = {
  local_verified: {
    label: 'Base local',
    short: 'Base local',
    description: 'Valors de referència compilats localment (aliments genèrics estables).',
  },
  open_food_facts: {
    label: 'Open Food Facts',
    short: 'OFF',
    description: 'Base de dades col·laborativa de productes comercials (codi de barres).',
    url: 'https://world.openfoodfacts.org',
  },
  usda: {
    label: 'USDA FoodData Central',
    short: 'USDA',
    description: 'Base oficial dels EUA per a aliments genèrics (composició per 100 g).',
    url: 'https://fdc.nal.usda.gov',
  },
  bedca: {
    label: 'BEDCA',
    short: 'BEDCA',
    description: 'Base de dades espanyola de composició d’aliments.',
    url: 'https://www.bedca.net',
  },
  nutritionix: {
    label: 'Nutritionix',
    short: 'Nutritionix',
    description: 'Parseig de llenguatge natural i base de productes.',
    url: 'https://www.nutritionix.com',
  },
  edamam: {
    label: 'Edamam',
    short: 'Edamam',
    description: 'Anàlisi nutricional per llenguatge natural.',
    url: 'https://www.edamam.com',
  },
  manual_estimate: {
    label: 'Estimació manual',
    short: 'Estimació',
    description: 'Valor introduït o estimat manualment, sense verificació externa.',
  },
  placeholder_pending_verification: {
    label: 'Pendent de verificar',
    short: 'Pendent',
    description: 'Valor provisional que s’ha de substituir per una font verificada.',
  },
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'alta',
  medium: 'mitjana',
  low: 'baixa',
};

export const PRECISION_LABEL: Record<Precision, string> = {
  weighed: 'pesat',
  estimated_portion: 'ració estimada',
  manual_estimate: 'estimació manual',
};

// Rànquings per calcular el "pitjor" cas d'una recepta (transparència: mai inflar)
const CONF_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
const PREC_RANK: Record<Precision, number> = { manual_estimate: 0, estimated_portion: 1, weighed: 2 };

export function worstConfidence(list: Confidence[]): Confidence {
  return list.reduce((w, c) => (CONF_RANK[c] < CONF_RANK[w] ? c : w), 'high');
}
export function worstPrecision(list: Precision[]): Precision {
  return list.reduce((w, p) => (PREC_RANK[p] < PREC_RANK[w] ? p : w), 'weighed');
}

/** Etiqueta curta per la targeta d'àpat: "Estimació · precisió mitjana". */
export function precisionSummary(precision: Precision, confidence: Confidence): string {
  const base = precision === 'weighed' ? 'Pesat' : 'Estimació';
  return `${base} · precisió ${CONFIDENCE_LABEL[confidence]}`;
}
