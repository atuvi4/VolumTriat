import { describe, expect, it } from 'vitest';
import { buildDailyLog, lastNDaysSummary, listDailyLogs, pruneHistory, upsertTodayLog } from './dailyLog';
import { emptyState } from '../data/emptyState';
import { todayISO, addDaysISO } from '../utils/date';
import type { AppState, DailyLog } from '../types';
import type { ResolvedMeal } from '../nutrition/nutritionTypes';

const meal = (over: Partial<ResolvedMeal>): ResolvedMeal =>
  ({
    id: 'day-dinar',
    slot: 'dinar',
    name: 'Arròs + pollastre',
    done: false,
    tags: [],
    nutrition: { kcal: 600, protein: 45, carbs: 60, fat: 15, fiber: 3 },
    precision: 'estimated_portion',
    confidence: 'medium',
    sources: ['local_verified'],
    ingredients: [],
    ...over,
  }) as ResolvedMeal;

function baseState(): AppState {
  const s = emptyState();
  s.profile = { ...s.profile, kcalGoal: 3000, protGoal: 150, projectStartDate: addDaysISO(todayISO(), -10) };
  return s;
}

describe('buildDailyLog — snapshot fidel del dia', () => {
  it('captura àpats menjats, extres, objectius del dia i suplements', () => {
    const s = baseState();
    s.meals = [
      meal({ id: 'day-dinar', done: true, status: 'done' }),
      meal({ id: 'day-sopar', slot: 'sopar', name: 'Truita + pa', status: 'pending' }),
      meal({ id: 'extra-1', isExtra: true, status: 'changed', logged: { name: 'Anabolic Masster', kcal: 183, protein: 23, note: 'etiqueta' } }),
    ];
    s.supplements.creatineDates = [s.date];
    const log = buildDailyLog(s);

    expect(log.kcal).toBe(600 + 183);
    expect(log.protein).toBe(45 + 23);
    expect(log.targetKcal).toBe(3000);
    expect(log.meals).toHaveLength(2); // planificats
    expect(log.meals[1].kcal).toBe(0); // pendent no compta
    expect(log.extras).toHaveLength(1);
    expect(log.supplements.creatine).toBe(true);
    expect(log.supplements.anabolicMaster).toBe(true);
  });

  it('els objectius del dia reflecteixen el mode (dia difícil)', () => {
    const s = baseState();
    s.dayMode = 'dificil';
    const log = buildDailyLog(s);
    expect(log.targetKcal).toBe(1800);
    expect(log.dayMode).toBe('dificil');
  });
});

describe('history — avui en viu, passat congelat', () => {
  it('listDailyLogs injecta avui derivat en viu i ordena descendent', () => {
    const s = baseState();
    const yesterday = addDaysISO(todayISO(), -1);
    s.history = { [yesterday]: { ...buildDailyLog(s), date: yesterday, kcal: 2800 } };
    s.meals = [meal({ status: 'done', done: true })];
    const logs = listDailyLogs(s);
    expect(logs[0].date).toBe(todayISO());
    expect(logs[0].kcal).toBe(600); // en viu, no d'un snapshot
    expect(logs[1].kcal).toBe(2800);
  });

  it('upsertTodayLog congela el dia carregat sense tocar la resta', () => {
    const s = baseState();
    s.meals = [meal({ status: 'done', done: true })];
    const next = upsertTodayLog(s);
    expect(next.history?.[s.date]?.kcal).toBe(600);
    expect(next.meals).toBe(s.meals); // res més canvia
  });

  it('pruneHistory limita les entrades mantenint les més recents', () => {
    const h: Record<string, DailyLog> = {};
    for (let i = 0; i < 450; i++) {
      const d = addDaysISO(todayISO(), -i);
      h[d] = { date: d } as DailyLog;
    }
    const pruned = pruneHistory(h);
    expect(Object.keys(pruned)).toHaveLength(400);
    expect(pruned[todayISO()]).toBeDefined();
    expect(pruned[addDaysISO(todayISO(), -449)]).toBeUndefined();
  });
});

describe('lastNDaysSummary — mitjanes i compliment honests', () => {
  it('les mitjanes només compten dies amb menjar registrat', () => {
    const s = baseState();
    const d1 = addDaysISO(todayISO(), -1);
    const d2 = addDaysISO(todayISO(), -2);
    const mk = (date: string, kcal: number, protein: number): DailyLog => ({
      date, kcal, protein, targetKcal: 3000, targetProtein: 150, meals: [], extras: [],
      supplements: { creatine: false }, training: { done: false }, completed: kcal >= 2700,
      createdAt: '', updatedAt: '',
    });
    s.history = { [d1]: mk(d1, 3000, 160), [d2]: mk(d2, 2600, 120) };
    const sum = lastNDaysSummary(s, 7);
    expect(sum.eatingDays).toBe(2); // avui buit no compta
    expect(sum.avgKcal).toBe(2800);
    expect(sum.proteinHitDays).toBe(1);
    expect(sum.kcalHitDays).toBe(1); // 2600 < 2700 (90%)
    expect(sum.completedDays).toBe(1);
  });
});
