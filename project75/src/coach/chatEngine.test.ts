import { describe, expect, it } from 'vitest';
import { isActionIntent, parseIntent } from './chatEngine';

describe('chatEngine — ordres', () => {
  it('afegir batut', () => {
    expect(parseIntent('Afegeix-me un batut')).toEqual({ kind: 'addShake' });
    expect(parseIntent('batut')).toEqual({ kind: 'addShake' });
  });

  it('marcar àpat fet', () => {
    expect(parseIntent('He fet el dinar')).toEqual({ kind: 'markMeal', slot: 'dinar' });
    expect(parseIntent("M'he menjat el sopar")).toEqual({ kind: 'markMeal', slot: 'sopar' });
  });

  it('saltar àpat', () => {
    expect(parseIntent("Salta'm el berenar")).toEqual({ kind: 'skipMeal', slot: 'berenar' });
    expect(parseIntent('avui no soparé')).toEqual({ kind: 'skipMeal', slot: 'sopar' });
  });

  it('canviar àpat, amb i sense preferència', () => {
    expect(parseIntent("Canvia'm el sopar")).toEqual({ kind: 'swapMeal', slot: 'sopar', query: undefined });
    expect(parseIntent('canvia el sopar per salmó')).toEqual({ kind: 'swapMeal', slot: 'sopar', query: 'salmo' });
  });

  it('desfer àpat', () => {
    expect(parseIntent('desfés el dinar')).toEqual({ kind: 'undoMeal', slot: 'dinar' });
  });

  it('extra manual amb macros', () => {
    const i = parseIntent('He menjat un entrepà de 450 kcal i 22 g de proteïna');
    expect(i.kind).toBe('addExtra');
    if (i.kind === 'addExtra') {
      expect(i.kcal).toBe(450);
      expect(i.protein).toBe(22);
      expect(i.name.toLowerCase()).toContain('entrepà');
    }
  });

  it('extra manual sense macros → demana dades (kcal undefined)', () => {
    const i = parseIntent('he menjat una pizza');
    expect(i.kind).toBe('addExtra');
    if (i.kind === 'addExtra') expect(i.kcal).toBeUndefined();
  });

  it('pes corporal amb coma decimal', () => {
    expect(parseIntent('peso 68,4')).toEqual({ kind: 'addWeight', kg: 68.4 });
    expect(parseIntent('registra 68.4 kg')).toEqual({ kind: 'addWeight', kg: 68.4 });
  });

  it('creatina i modes del dia', () => {
    expect(parseIntent('creatina feta')).toEqual({ kind: 'creatine' });
    expect(parseIntent('avui estic fatal')).toEqual({ kind: 'hardDay' });
    expect(parseIntent('no tinc gens de gana')).toEqual({ kind: 'lowAppetite' });
  });
});

describe('chatEngine — adaptar àpat (ingredient que falta)', () => {
  it('«no tinc plàtan» amb i sense àpat indicat', () => {
    expect(parseIntent('no tinc plàtan')).toEqual({ kind: 'adaptMeal', missing: 'platan', slot: undefined });
    expect(parseIntent('no tinc plàtan per berenar')).toEqual({ kind: 'adaptMeal', missing: 'platan', slot: 'berenar' });
    expect(parseIntent("m'he quedat sense iogurt")).toEqual({ kind: 'adaptMeal', missing: 'iogurt', slot: undefined });
    expect(parseIntent('no em queda civada')).toEqual({ kind: 'adaptMeal', missing: 'civada', slot: undefined });
  });

  it('«tinc X, no el Y» / «en lloc de» / «només tinc» → substituir variant', () => {
    expect(parseIntent('tinc el iogurt grec natural del consum no el proteic')).toEqual({
      kind: 'substituteIngredient', have: 'iogurt grec natural del consum', insteadOf: 'proteic', slot: undefined,
    });
    expect(parseIntent('tinc llet sencera en lloc de iogurt')).toEqual({
      kind: 'substituteIngredient', have: 'llet sencera', insteadOf: 'iogurt', slot: undefined,
    });
    expect(parseIntent('només tinc pa per esmorzar')).toEqual({
      kind: 'substituteIngredient', have: 'pa', slot: 'esmorzar',
    });
  });

  it('«només tinc 250 grams de iogurt» → quantitat limitada', () => {
    expect(parseIntent('només tinc 250 grams de iogurt')).toEqual({
      kind: 'limitIngredient', ingredient: 'iogurt', grams: 250, slot: undefined,
    });
    expect(parseIntent('em queden 30 g de civada per esmorzar')).toEqual({
      kind: 'limitIngredient', ingredient: 'civada', grams: 30, slot: 'esmorzar',
    });
    // sense quantitat segueix sent substitució de variant
    expect(parseIntent('només tinc pa').kind).toBe('substituteIngredient');
  });

  it('«afegeix mel al berenar» (i el typo «afageixo») → afegir ingredient', () => {
    expect(parseIntent('afegeix mel al berenar')).toEqual({
      kind: 'addIngredient', ingredient: 'mel', grams: undefined, slot: 'berenar',
    });
    expect(parseIntent('afageixo mel al berenar')).toEqual({
      kind: 'addIngredient', ingredient: 'mel', grams: undefined, slot: 'berenar',
    });
    expect(parseIntent('afegeix 20 g de mel al berenar')).toEqual({
      kind: 'addIngredient', ingredient: 'mel', grams: 20, slot: 'berenar',
    });
    // «afegeix un batut» segueix sent el batut d'un toc
    expect(parseIntent('afegeix un batut').kind).toBe('addShake');
  });

  it('mai confon «no tinc gana» amb un ingredient', () => {
    expect(parseIntent('no tinc gana').kind).toBe('lowAppetite');
    expect(parseIntent('no tinc gens de gana').kind).toBe('lowAppetite');
  });
});

describe('chatEngine — preguntes', () => {
  it('estat, restants, proper àpat, entrenament, tendència', () => {
    expect(parseIntent('com vaig?').kind).toBe('status');
    expect(parseIntent('quantes kcal em falten?').kind).toBe('remaining');
    expect(parseIntent('què em toca ara?').kind).toBe('nextMeal');
    expect(parseIntent('què entreno avui?').kind).toBe('training');
    expect(parseIntent('com va el pes?').kind).toBe('weightTrend');
  });

  it('ajuda i desconegut', () => {
    expect(parseIntent('què pots fer?').kind).toBe('help');
    expect(parseIntent('bla bla bla').kind).toBe('unknown');
  });
});

describe('chatEngine — seguretat', () => {
  it('distingeix accions de consultes (per al mode visita)', () => {
    expect(isActionIntent(parseIntent('afegeix un batut'))).toBe(true);
    expect(isActionIntent(parseIntent('com vaig?'))).toBe(false);
    expect(isActionIntent(parseIntent('peso 70'))).toBe(true);
  });

  it('mai confon kcal amb pes corporal', () => {
    expect(parseIntent('he menjat 450 kcal').kind).toBe('addExtra');
  });
});
