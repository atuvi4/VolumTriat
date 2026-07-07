import { describe, expect, it } from 'vitest';
import { computeTargets, type TargetInput } from './nutritionTargets';

const base: TargetInput = { sex: 'male', age: 30, heightCm: 178, weightKg: 80, ritme: 'moderat' };

describe('computeTargets — objectiu', () => {
  it('cut < maintain < bulk en kcal inicial', () => {
    const cut = computeTargets({ ...base, goal: 'cut' }).kcalStart;
    const maintain = computeTargets({ ...base, goal: 'maintain' }).kcalStart;
    const bulk = computeTargets({ ...base, goal: 'bulk' }).kcalStart;
    expect(cut).toBeLessThan(maintain);
    expect(maintain).toBeLessThan(bulk);
  });

  it('el dèficit (cut) mai baixa del BMR', () => {
    const t = computeTargets({ ...base, goal: 'cut', ritme: 'agressiu' });
    expect(t.kcalStart).toBeGreaterThanOrEqual(Math.round(t.bmr / 50) * 50);
  });

  it('sense goal es comporta com bulk (compat)', () => {
    const noGoal = computeTargets(base).kcalStart;
    const bulk = computeTargets({ ...base, goal: 'bulk' }).kcalStart;
    expect(noGoal).toBe(bulk);
  });

  it('la proteïna es manté ~2 g/kg en tots els objectius', () => {
    for (const goal of ['cut', 'maintain', 'bulk'] as const) {
      expect(computeTargets({ ...base, goal }).proteinGrams).toBe(Math.round(base.weightKg * 2.0));
    }
  });
});
