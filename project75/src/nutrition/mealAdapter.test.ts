import { describe, expect, it } from 'vitest';
import { adaptMealWithLimit, adaptMealWithout, ingredientMatches, substituteIngredientInMeal } from './mealAdapter';
import { resolveRecipe, previewNutrition } from './mealBuilder';
import { defaultDayRecipes, RECIPE_POOL } from './mealPlans';

// El berenar base real: iogurt grec + civada + mel + cacauet.
const berenar = () => resolveRecipe(defaultDayRecipes().find((r) => r.slot === 'berenar')!, { id: 'day-berenar' });
// L'snack base real: batut de llet + plàtan + civada.
const snack = () => resolveRecipe(defaultDayRecipes().find((r) => r.slot === 'snack')!, { id: 'day-snack' });

describe('ingredientMatches — noms flexibles', () => {
  it('singular/plural i noms compostos', () => {
    expect(ingredientMatches('Plàtan', 'platans')).toBe(true);
    expect(ingredientMatches('Iogurt grec', 'iogurt')).toBe(true);
    expect(ingredientMatches('Crema de cacauet', 'cacauet')).toBe(true);
    expect(ingredientMatches('Plàtan', 'iogurt')).toBe(false);
  });
});

describe('adaptMealWithout — quadra kcal sense inventar', () => {
  it('treu el plàtan del batut i repuja la resta cap a les kcal originals', () => {
    const m = snack();
    const adapted = adaptMealWithout(m, 'plàtan')!;
    expect(adapted).not.toBeNull();
    expect(adapted.removedName.toLowerCase()).toContain('plàtan');
    expect(adapted.recipe.name).toContain('sense');
    // Tots els ingredients restants pugen (mai baixen) i dins de límits de seny.
    for (const c of adapted.changes) {
      expect(c.toG).toBeGreaterThanOrEqual(c.fromG);
      expect(c.toG).toBeLessThanOrEqual(Math.max(c.fromG, Math.min(800, Math.round(c.fromG * 1.75 / 5) * 5)));
    }
    // La nutrició final la dona el MOTOR i s'acosta a l'original (±20%).
    const n = previewNutrition(adapted.recipe);
    expect(n.kcal).toBeGreaterThan(m.nutrition.kcal * 0.8);
    expect(n.kcal).toBeLessThanOrEqual(m.nutrition.kcal * 1.2);
  });

  it('rebost intel·ligent: si repujar no arriba, AFEGEIX un bàsic del mateix rol', () => {
    // Sopar pasta+tonyina+formatge sense pasta: la resta no pot recuperar-ho
    // ni amb +75% → ha d'afegir un carbohidrat de rebost (mel/civada...).
    const sopar = resolveRecipe(RECIPE_POOL.find((r) => r.id === 'r-sopar-pasta-tonyina-formatge')!, { id: 'day-sopar' });
    const adapted = adaptMealWithout(sopar, 'pasta')!;
    expect(adapted).not.toBeNull();
    const added = adapted.changes.find((c) => c.fromG === 0);
    expect(added).toBeDefined(); // hi ha un ingredient NOU de rebost
    const n = previewNutrition(adapted.recipe);
    expect(n.kcal).toBeGreaterThan(sopar.nutrition.kcal * 0.8); // recupera el gruix
    expect(n.kcal).toBeLessThanOrEqual(sopar.nutrition.kcal * 1.2);
  });

  it('si l\'àpat no porta l\'ingredient → null (mai adapta a cegues)', () => {
    expect(adaptMealWithout(berenar(), 'salmó')).toBeNull();
  });

  it('substitueix una variant reajustant grams per proteïna, calculat pel motor', () => {
    const m = snack(); // llet + plàtan + civada
    const res = substituteIngredientInMeal(m, 'iogurt grec', 'llet')!;
    expect(res.kind).toBe('adapted');
    if (res.kind === 'adapted') {
      expect(res.fromName.toLowerCase()).toContain('llet');
      expect(res.toName.toLowerCase()).toContain('iogurt');
      expect(res.toG).toBeGreaterThan(0);
      const n = previewNutrition(res.recipe);
      expect(n.kcal).toBeGreaterThan(0); // resoluble pel motor, mai inventat
    }
  });

  it('si el pla ja porta el que l\'usuari té → «already», res a canviar', () => {
    const res = substituteIngredientInMeal(berenar(), 'iogurt grec natural del consum', 'proteic')!;
    expect(res.kind).toBe('already');
    if (res.kind === 'already') expect(res.foodName.toLowerCase()).toContain('iogurt grec');
  });

  it('quantitat limitada: retalla l\'ingredient i repuja la resta', () => {
    const m = berenar(); // iogurt 200 g + civada + mel + cacauet
    const res = adaptMealWithLimit(m, 'iogurt', 120)!;
    expect(res.kind).toBe('adapted');
    if (res.kind === 'adapted') {
      const yog = res.changes.find((c) => /iogurt/i.test(c.name))!;
      expect(yog.toG).toBe(120); // mai compta més del que hi ha
      const others = res.changes.filter((c) => c !== yog);
      expect(others.every((c) => c.toG >= c.fromG)).toBe(true); // la resta puja
      const n = previewNutrition(res.recipe);
      expect(n.kcal).toBeGreaterThan(m.nutrition.kcal * 0.75); // recupera bona part
      expect(n.kcal).toBeLessThanOrEqual(m.nutrition.kcal * 1.15);
    }
  });

  it('si en té prou (250 g quan en calen 200) → «enough», res a tocar', () => {
    const res = adaptMealWithLimit(berenar(), 'iogurt', 250)!;
    expect(res.kind).toBe('enough');
    if (res.kind === 'enough') {
      expect(res.neededG).toBe(200);
      expect(res.haveG).toBe(250);
    }
  });

  it('el nom no acumula «(sense …)» en adaptar dues vegades', () => {
    const m = snack();
    const a1 = adaptMealWithout(m, 'plàtan')!;
    const fake = { ...m, name: a1.recipe.name };
    const a2 = adaptMealWithout(fake, 'civada')!;
    expect(a2.recipe.name.match(/\(sense/g)).toHaveLength(1);
  });
});
