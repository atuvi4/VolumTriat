import { describe, expect, it } from 'vitest';
import { goalsFor, milestonesFor, nextMilestone } from './goals';
import type { AppState } from '../types';

const stateWith = (kcalGoal: number, protGoal: number, dayMode: AppState['dayMode']): AppState =>
  ({ dayMode, profile: { kcalGoal, protGoal, ritme: 'agressiu' } }) as AppState;

describe('goalsFor — modes derivats del perfil (mai xifres fixes)', () => {
  it('dia difícil ≈ 60% kcal / 55% proteïna', () => {
    const g = goalsFor(stateWith(3000, 150, 'dificil'));
    expect(g.kcal).toBe(1800);
    expect(g.prot).toBe(80);
  });

  it('poca gana ≈ 85% kcal / 80% proteïna', () => {
    const g = goalsFor(stateWith(3000, 150, 'pocaGana'));
    expect(g.kcal).toBe(2550);
    expect(g.prot).toBe(120);
  });

  it('els modes especials mai superen l’objectiu normal (coherent amb cut)', () => {
    const cutKcal = 2000;
    for (const mode of ['dificil', 'pocaGana'] as const) {
      expect(goalsFor(stateWith(cutKcal, 130, mode)).kcal).toBeLessThan(cutKcal);
    }
  });
});

describe('milestones — personalitzats des del perfil', () => {
  it('genera fites entre inici i objectiu (bulk 67→75)', () => {
    expect(milestonesFor(67, 75)).toEqual([69, 71, 73, 75]);
  });

  it('funciona en direcció de baixada (cut 90→82)', () => {
    const miles = milestonesFor(90, 82);
    expect(miles[miles.length - 1]).toBe(82);
    expect(miles.every((m) => m < 90)).toBe(true);
  });

  it('la propera fita respecta la direcció', () => {
    expect(nextMilestone(70, 67, 75)).toBe(71);
    expect(nextMilestone(88, 90, 82)).toBe(86);
    expect(nextMilestone(75, 67, 75)).toBe(75); // arribat: retorna l’objectiu
  });
});
