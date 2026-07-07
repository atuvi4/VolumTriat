import { describe, expect, it } from 'vitest';
import { sumIngredients } from './mealCalc';

describe('sumIngredients', () => {
  it('suma correctament pollastre + patata', () => {
    // pollastre 165 kcal/100g, 31 P → 160 g = 264 kcal, 49.6 P
    // patata 87 kcal/100g, 1.9 P → 300 g = 261 kcal, 5.7 P
    const t = sumIngredients([
      { kcalPer100g: 165, proteinPer100g: 31, grams: 160 },
      { kcalPer100g: 87, proteinPer100g: 1.9, grams: 300 },
    ]);
    expect(t.kcal).toBe(525); // 264 + 261
    expect(t.protein).toBe(55); // 49.6 + 5.7 = 55.3 → 55
  });

  it('llista buida → 0', () => {
    expect(sumIngredients([])).toEqual({ kcal: 0, protein: 0 });
  });

  it('ignora valors no vàlids (NaN/negatius) sense petar', () => {
    const t = sumIngredients([
      { kcalPer100g: NaN, proteinPer100g: 20, grams: 100 },
      { kcalPer100g: 200, proteinPer100g: 10, grams: -50 },
      { kcalPer100g: 100, proteinPer100g: 5, grams: 100 },
    ]);
    // només l'últim compta: 100 kcal, 5 P; els altres tenen kcal NaN o grams negatius
    expect(t.kcal).toBe(100);
    expect(t.protein).toBe(25); // 20 (grams 100, kcal NaN però proteïna sí) + 0 + 5
    expect(Number.isFinite(t.kcal)).toBe(true);
    expect(Number.isFinite(t.protein)).toBe(true);
  });

  it('arrodoneix una sola vegada (sense acumular error)', () => {
    const t = sumIngredients([
      { kcalPer100g: 33.3, proteinPer100g: 3.3, grams: 100 },
      { kcalPer100g: 33.3, proteinPer100g: 3.3, grams: 100 },
      { kcalPer100g: 33.3, proteinPer100g: 3.3, grams: 100 },
    ]);
    expect(t.kcal).toBe(100); // 99.9 → 100
    expect(t.protein).toBe(10); // 9.9 → 10
  });
});
