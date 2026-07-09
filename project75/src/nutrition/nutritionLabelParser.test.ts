import { describe, expect, it } from 'vitest';
import { normalizeLabelNumber, parseNutritionLabelText } from './nutritionLabelParser';

const CA = `Informació nutricional per 100 g
Valor energètic 1520 kJ / 363 kcal
Greixos 6,5 g
  de les quals saturades 1,1 g
Hidrats de carboni 58 g
  dels quals sucres 1,2 g
Proteïnes 13 g
Sal 0,02 g`;

const ES = `Información nutricional. Por 100 g. Ración: 30 g
Valor energético 2093 kJ / 500 kcal
Grasas 28 g
de las cuales saturadas 12 g
Hidratos de carbono 52 g
de los cuales azúcares 45 g
Proteínas 7,5 g`;

const EN = `Nutrition facts per serving (45 g)
Energy 180 kcal
Fat 8 g
Carbohydrates 22 g
Protein 4 g`;

describe('nutritionLabelParser — etiquetes reals', () => {
  it('etiqueta en català (civada)', () => {
    const p = parseNutritionLabelText(CA);
    expect(p.basis).toBe('per100g');
    expect(p.kcal).toBe(363);
    expect(p.fat).toBe(6.5); // NO les saturades
    expect(p.carbs).toBe(58); // NO els sucres
    expect(p.protein).toBe(13);
  });

  it('etiqueta en castellà amb kJ/kcal i ració', () => {
    const p = parseNutritionLabelText(ES);
    expect(p.kcal).toBe(500); // mai agafa els 2093 kJ
    expect(p.protein).toBe(7.5);
    expect(p.servingGrams).toBe(30);
    expect(p.basis).toBe('per100g'); // "por 100 g" mana sobre la ració
  });

  it('etiqueta en anglès per ració', () => {
    const p = parseNutritionLabelText(EN);
    expect(p.basis).toBe('perServing');
    expect(p.servingGrams).toBe(45);
    expect(p.kcal).toBe(180);
    expect(p.protein).toBe(4);
  });

  it('només kJ → converteix amb avís', () => {
    const p = parseNutritionLabelText('per 100 g\nValor energètic 1046 kJ\nProteïnes 10 g');
    expect(p.kcal).toBe(250);
    expect(p.warnings.some((w) => w.includes('kJ'))).toBe(true);
    expect(p.confidence).toBe('low'); // amb avisos mai passa de low
  });

  it('mai inventa: text il·legible → camps buits i avís', () => {
    const p = parseNutritionLabelText('bla bla bla res de res');
    expect(p.kcal).toBeUndefined();
    expect(p.protein).toBeUndefined();
    expect(p.warnings.some((w) => w.includes('No he pogut llegir'))).toBe(true);
    expect(p.confidence).toBe('low');
  });

  it('valors absurds per 100 g → warning, no bloqueig', () => {
    const p = parseNutritionLabelText('per 100 g\n1200 kcal\nProteïnes 98 g');
    expect(p.kcal).toBe(1200);
    expect(p.warnings.some((w) => w.includes('900 kcal'))).toBe(true);
    expect(p.warnings.some((w) => w.includes('95 g'))).toBe(true);
  });

  it('incoherència macros ↔ kcal → warning', () => {
    const p = parseNutritionLabelText('per 100 g\n100 kcal\nGreixos 30 g\nHidrats de carboni 40 g\nProteïnes 30 g');
    expect(p.warnings.some((w) => w.includes('sumen'))).toBe(true);
  });

  it('tolera errors típics d\'OCR (lletres canviades, frases escapçades)', () => {
    const OCR = `informacio nutricional per 100 g
valor energetic 1520 kJ / 363 kcal
greixos 6,5 g
hidrats d carboni 58 g
prote'ines 13 g`;
    const p = parseNutritionLabelText(OCR);
    expect(p.kcal).toBe(363);
    expect(p.fat).toBe(6.5);
    expect(p.carbs).toBe(58);
    expect(p.protein).toBe(13);
  });

  it('normalizeLabelNumber: comes i milers', () => {
    expect(normalizeLabelNumber('12,5')).toBe(12.5);
    expect(normalizeLabelNumber('12.5')).toBe(12.5);
    expect(normalizeLabelNumber('1.234,5')).toBe(1234.5);
  });
});
