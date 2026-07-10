import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Icon from './Icon';
import { HELP_TEXT, isActionIntent, parseIntent, type ChatIntent } from '../coach/chatEngine';
import { goalsFor, doneKcal, doneProt, doneCount, mealStatus, currentWeight, MIN_FOR_TREND } from '../utils/goals';
import { trendPerWeekWindow } from '../nutrition/adjustmentRules';
import { nutritionAdjust } from '../utils/nutritionAdvice';
import { resolveTodayTraining } from '../data/week';
import { swapOptionsFor } from '../nutrition/mealPlans';
import { adaptMealWithout, ingredientMatches, substituteIngredientInMeal } from '../nutrition/mealAdapter';
import { rankSwapOptions } from '../brain/brain';
import { previewNutrition } from '../nutrition/mealBuilder';
import { realWeights } from '../utils/project';
import { fmt1, nf } from '../utils/format';
import type { MealSlot, MealRecipe, ResolvedMeal } from '../nutrition/nutritionTypes';

/* Coach Xat v1 — assistent LOCAL (regles + dades reals, sense IA de pagament).
   Executa les MATEIXES accions que la resta de l'app (guardades pel mode
   visita) i respon amb l'estat real. Mai inventa macros. */

interface ChatOption {
  label: string;
  run: () => void;
}

interface ChatMsg {
  id: number;
  role: 'user' | 'coach';
  text: string;
  options?: ChatOption[];
}

const SLOT_ORDER: MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];

const SUGGESTIONS = ['Com vaig?', 'Què em toca ara?', 'Afegeix un batut', "Canvia'm el sopar"];

/** Validació mínima d'una dada manual (mai desar números impossibles). */
function plausible(kcal: number, protein: number): boolean {
  if (!Number.isFinite(kcal) || kcal <= 0 || kcal > 2500) return false;
  if (!Number.isFinite(protein) || protein < 0 || protein > 250) return false;
  return protein * 4 <= kcal * 1.15 + 25;
}

export default function CoachChat() {
  const app = useApp();
  const { state, isReadOnly } = app;
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const push = (m: Omit<ChatMsg, 'id'>) => setMessages((prev) => [...prev, { ...m, id: ++idRef.current }]);
  const coach = (text: string, options?: ChatOption[]) => push({ role: 'coach', text, options });

  const plannedBySlot = (slot: MealSlot): ResolvedMeal | undefined =>
    state.meals.find((m) => !m.isExtra && m.slot === slot);

  const doSwap = (meal: ResolvedMeal, r: MealRecipe) => {
    const n = previewNutrition(r);
    app.swapMeal(meal.id, r);
    coach(`✓ ${meal.slot} canviat a «${r.name}» · ${n.kcal} kcal · ${n.protein} g proteïna (calculat per ingredients).`);
  };

  const offerAlternatives = (meal: ResolvedMeal, lead: string) => {
    const ranked = rankSwapOptions(swapOptionsFor(meal, state.dislikes), state.outcomes ?? []).slice(0, 4);
    coach(lead, ranked.map((r) => ({ label: `${r.name} · ${previewNutrition(r).kcal} kcal`, run: () => doSwap(meal, r) })));
  };

  const handle = (intent: ChatIntent) => {
    if (isReadOnly && isActionIntent(intent)) {
      coach('Mode visita: les accions estan bloquejades. Les preguntes sí que et responc.');
      return;
    }

    const g = goalsFor(state);
    const dk = doneKcal(state.meals);
    const dp = doneProt(state.meals);
    const left = Math.max(0, g.kcal - dk);
    const protLeft = Math.max(0, g.prot - dp);

    switch (intent.kind) {
      case 'help':
        coach(HELP_TEXT);
        return;

      case 'status': {
        const rw = realWeights(state);
        const trendLine =
          rw.length >= MIN_FOR_TREND
            ? ` Tendència 14 dies: ${(trendPerWeekWindow(rw, 14) ?? 0) >= 0 ? '+' : ''}${fmt1(trendPerWeekWindow(rw, 14) ?? 0)} kg/setm.`
            : '';
        coach(
          `${nf(dk)}/${nf(g.kcal)} kcal · ${dp}/${g.prot} g proteïna · ${doneCount(state.meals)}/${g.meals} ingestes (${g.label}).${trendLine}`,
        );
        return;
      }

      case 'remaining': {
        if (left === 0 && protLeft === 0) {
          coach('Res: calories i proteïna cobertes. Dia tancat.');
          return;
        }
        const adj = nutritionAdjust(state);
        coach(`Et falten ${nf(left)} kcal i ${protLeft} g de proteïna. ${adj.actions[0] ?? ''}`);
        return;
      }

      case 'nextMeal': {
        const next = SLOT_ORDER.map(plannedBySlot).find((m) => m && mealStatus(m) === 'pending');
        if (!next) {
          coach('No tens cap àpat pendent del pla. Si menges alguna cosa més, digue-m\'ho i l\'apunto com a extra.');
          return;
        }
        coach(`Et toca ${next.slot}: «${next.name}» · ${next.nutrition.kcal} kcal · ${next.nutrition.protein} g proteïna. Quan te'l mengis, digue'm «he fet el ${next.slot}».`);
        return;
      }

      case 'training': {
        const t = resolveTodayTraining(state.profile.projectStartDate);
        coach(`Avui: ${t.workout.label}. ${t.workout.focus}${state.gymDone ? ' (Ja l\'has marcat feta ✓)' : ''}`);
        return;
      }

      case 'weightTrend': {
        const rw = realWeights(state);
        if (!rw.length) {
          coach('Encara no tens cap pes registrat. Digue\'m «peso 68,4» i l\'apunto.');
          return;
        }
        if (rw.length < MIN_FOR_TREND) {
          coach(`Últim pes: ${fmt1(currentWeight(rw))} kg. Em falten registres per llegir la tendència (${rw.length}/${MIN_FOR_TREND}); pesa't 2-3 cops per setmana.`);
          return;
        }
        const tr = trendPerWeekWindow(rw, 14) ?? 0;
        coach(`Pes actual ${fmt1(currentWeight(rw))} kg · tendència 14 dies ${tr >= 0 ? '+' : ''}${fmt1(tr)} kg/setmana.`);
        return;
      }

      case 'addShake':
        app.addShake();
        coach('✓ Batut afegit i comptat (recepta calculada). Bona jugada per tancar calories.');
        return;

      case 'creatine': {
        const done = state.supplements?.creatineDates?.includes(state.date);
        app.toggleCreatine();
        coach(done ? '✓ Creatina desmarcada per avui.' : '✓ Creatina anotada per avui. Hàbit diari, 0 kcal.');
        return;
      }

      case 'addWeight':
        app.addWeight(intent.kg);
        coach(`✓ Pes registrat: ${fmt1(intent.kg)} kg. La tendència es llegeix amb el patró de dies, no amb un sol pesatge.`);
        return;

      case 'hardDay': {
        const g2 = goalsFor({ ...state, dayMode: state.dayMode === 'dificil' ? 'normal' : 'dificil' });
        app.toggleHardDay();
        coach(
          state.dayMode === 'dificil'
            ? '✓ Tornem al pla normal.'
            : `✓ Mode dia difícil activat, sense culpa. Objectiu mínim d'avui: ${nf(g2.kcal)} kcal i ${g2.prot} g — una ingesta fàcil ja salva el dia.`,
        );
        return;
      }

      case 'lowAppetite': {
        const g2 = goalsFor({ ...state, dayMode: state.dayMode === 'pocaGana' ? 'normal' : 'pocaGana' });
        app.toggleLowAppetite();
        coach(
          state.dayMode === 'pocaGana'
            ? '✓ Tornem al pla normal.'
            : `✓ Mode poca gana: objectiu ajustat a ${nf(g2.kcal)} kcal i prioritzo calories líquides. Un batut ara suma molt sense esforç.`,
        );
        return;
      }

      case 'markMeal': {
        const meal = plannedBySlot(intent.slot);
        if (!meal) {
          coach(`Avui no tinc cap ${intent.slot} al pla.`);
          return;
        }
        if (mealStatus(meal) !== 'pending') {
          coach(`El ${intent.slot} ja consta com a ${mealStatus(meal)}. Si vols tornar-lo a pendent, digue'm «desfés el ${intent.slot}».`);
          return;
        }
        app.markMeal(meal.id);
        coach(`✓ «${meal.name}» fet · +${meal.nutrition.kcal} kcal · +${meal.nutrition.protein} g proteïna. Et queden ~${nf(Math.max(0, left - meal.nutrition.kcal))} kcal per l'objectiu.`);
        return;
      }

      case 'skipMeal': {
        const meal = plannedBySlot(intent.slot);
        if (!meal) {
          coach(`Avui no tinc cap ${intent.slot} al pla.`);
          return;
        }
        app.skipMeal(meal.id);
        coach(`✓ ${intent.slot} saltat, sense culpa. Si més tard vols compensar, un batut és la via fàcil (digue'm «afegeix un batut»).`);
        return;
      }

      case 'undoMeal': {
        const meal = plannedBySlot(intent.slot);
        if (!meal) {
          coach(`Avui no tinc cap ${intent.slot} al pla.`);
          return;
        }
        app.undoMeal(meal.id);
        coach(`✓ ${intent.slot} torna a pendent (i he restat el que comptava).`);
        return;
      }

      case 'swapMeal': {
        const meal = plannedBySlot(intent.slot);
        if (!meal) {
          coach(`Avui no tinc cap ${intent.slot} al pla.`);
          return;
        }
        if (mealStatus(meal) !== 'pending') {
          coach(`El ${intent.slot} ja consta com a ${mealStatus(meal)}. Desfés-lo primer si el vols canviar.`);
          return;
        }
        const ranked = rankSwapOptions(swapOptionsFor(meal, state.dislikes), state.outcomes ?? []);
        if (!ranked.length) {
          coach('No tinc alternatives per aquest àpat ara mateix.');
          return;
        }
        if (intent.query) {
          const hit = ranked.find((r) => r.name.toLowerCase().includes(intent.query!));
          if (hit) {
            doSwap(meal, hit);
            return;
          }
          coach(`No tinc cap alternativa amb «${intent.query}». Opcions reals que et puc posar:`, ranked.slice(0, 4).map((r) => ({
            label: `${r.name} · ${previewNutrition(r).kcal} kcal`,
            run: () => doSwap(meal, r),
          })));
          return;
        }
        coach(`Alternatives per al ${intent.slot} (calculades per ingredients; les que et funcionen surten primer):`, ranked.slice(0, 4).map((r) => ({
          label: `${r.name} · ${previewNutrition(r).kcal} kcal`,
          run: () => doSwap(meal, r),
        })));
        return;
      }

      case 'adaptMeal': {
        // Candidat: el pendent del slot indicat, o el primer pendent que porti l'ingredient.
        const pending = SLOT_ORDER.map(plannedBySlot).filter((m): m is ResolvedMeal => !!m && mealStatus(m) === 'pending');
        const meal = intent.slot
          ? pending.find((m) => m.slot === intent.slot)
          : pending.find((m) => m.ingredients.some((i) => ingredientMatches(i.name, intent.missing)));
        if (!meal) {
          coach(
            intent.slot
              ? `Avui no tens cap ${intent.slot} pendent per adaptar.`
              : `Cap àpat pendent d'avui porta «${intent.missing}». Si en vols canviar un igualment, digue'm «canvia'm el [àpat]».`,
          );
          return;
        }
        const adapted = adaptMealWithout(meal, intent.missing);
        if (!adapted) {
          const carries = meal.ingredients.some((i) => ingredientMatches(i.name, intent.missing));
          offerAlternatives(
            meal,
            carries
              ? `El ${meal.slot} porta ${intent.missing} però adaptar-lo el deixaria coix. Millor una alternativa (calculades pel motor):`
              : `El ${meal.slot} d'avui («${meal.name}») no porta ${intent.missing}. Si el vols canviar igualment:`,
          );
          return;
        }
        const n = previewNutrition(adapted.recipe);
        const protDrop = meal.nutrition.protein - n.protein;
        coach(
          `Sense ${adapted.removedName.toLowerCase()}, t'ho quadro repujant la resta: ${adapted.changes
            .map((c) => `${c.name} ${c.fromG}→${c.toG} g`)
            .join(' · ')}.\nQueda en ${n.kcal} kcal · ${n.protein} g proteïna (abans ${meal.nutrition.kcal} · ${meal.nutrition.protein} g), calculat per ingredients.${
            protDrop >= 8 ? `\nPerds ~${Math.round(protDrop)} g de proteïna: valora acompanyar-ho amb iogurt o un batut.` : ''
          }`,
          [
            { label: `✓ Aplicar al ${meal.slot}`, run: () => doSwap(meal, adapted.recipe) },
            { label: 'Millor una alternativa', run: () => offerAlternatives(meal, `Alternatives per al ${meal.slot}:`) },
          ],
        );
        return;
      }

      case 'substituteIngredient': {
        const pending = SLOT_ORDER.map(plannedBySlot).filter((m): m is ResolvedMeal => !!m && mealStatus(m) === 'pending');
        const meal = intent.slot
          ? pending.find((m) => m.slot === intent.slot)
          : pending.find((m) =>
              m.ingredients.some(
                (i) => ingredientMatches(i.name, intent.insteadOf ?? intent.have) || ingredientMatches(i.name, intent.have),
              ),
            );
        if (!meal) {
          coach(`Cap àpat pendent d'avui porta res semblant a «${intent.insteadOf ?? intent.have}».`);
          return;
        }
        const res = substituteIngredientInMeal(meal, intent.have, intent.insteadOf);
        if (!res) {
          offerAlternatives(meal, `No he sabut encaixar «${intent.have}» al ${meal.slot}. Si vols, canvia'l per una alternativa:`);
          return;
        }
        if (res.kind === 'already') {
          coach(
            `Bona notícia: el ${meal.slot} ja compta amb ${res.foodName.toLowerCase()} normal (${res.kcalPer100g} kcal · ${res.proteinPer100g} g de proteïna per 100 g, base local). No cal canviar res — marca'l «Fet» quan te'l mengis.`,
          );
          return;
        }
        const n = previewNutrition(res.recipe);
        coach(
          `Amb ${res.toName.toLowerCase()} en lloc de ${res.fromName.toLowerCase()}: ${res.fromG}→${res.toG} g per mantenir la proteïna.\nQueda en ${n.kcal} kcal · ${n.protein} g proteïna (abans ${meal.nutrition.kcal} · ${meal.nutrition.protein} g), calculat per ingredients.`,
          [
            { label: `✓ Aplicar al ${meal.slot}`, run: () => doSwap(meal, res.recipe) },
            { label: 'Millor una alternativa', run: () => offerAlternatives(meal, `Alternatives per al ${meal.slot}:`) },
          ],
        );
        return;
      }

      case 'addExtra': {
        if (intent.kcal == null) {
          coach(`Per apuntar «${intent.name}» necessito les kcal (i si pot ser la proteïna) de l'etiqueta o una estimació teva — mai m'invento macros. Exemple: «he menjat ${intent.name.toLowerCase()} de 450 kcal i 20 g de proteïna».`);
          return;
        }
        const protein = intent.protein ?? 0;
        if (!plausible(intent.kcal, protein)) {
          coach('Aquests números no em quadren (revisa kcal i proteïna). No desaré una dada impossible.');
          return;
        }
        app.addExtra({ name: intent.name, kcal: Math.round(intent.kcal), protein: Math.round(protein) });
        coach(
          `✓ «${intent.name}» apuntat com a extra · ${Math.round(intent.kcal)} kcal · ${Math.round(protein)} g proteïna (dada manual, confiança baixa).${intent.protein == null ? ' No m\'has dit proteïna: he comptat 0 g per no inflar res.' : ''}`,
        );
        return;
      }

      default:
        coach(`No t'he entès. ${HELP_TEXT}`);
    }
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    push({ role: 'user', text: t });
    handle(parseIntent(t));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
    setInput('');
  };

  return (
    <Card title="Parla amb el coach" className="mb-3.5">
      <p className="text-[12px] text-muted mt-0 mb-2.5">
        Assistent local: regles + les teves dades d'avui, sense IA al núvol. No inventa macros.
      </p>

      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-[320px] overflow-y-auto flex flex-col gap-2 mb-3 pr-1">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[92%]'}>
              <div
                className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-[16px] rounded-br-[5px]'
                    : 'bg-surface2 border border-line rounded-[16px] rounded-bl-[5px]'
                }`}
              >
                {m.text}
              </div>
              {m.options && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {m.options.map((o) => (
                    <button
                      key={o.label}
                      onClick={o.run}
                      className="text-[12.5px] font-semibold text-accent-strong bg-accent-soft border border-accent-line rounded-full px-3 py-1.5 hover:bg-accent-line/50 transition-colors"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[12.5px] font-semibold text-muted bg-surface2 border border-line2 rounded-full px-3 py-1.5 hover:border-faint transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Escriu... («salta el berenar», «com vaig?»)'
          aria-label="Missatge per al coach"
          className="flex-1 bg-surface2 border border-line2 rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-[border-color,box-shadow]"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="shrink-0 w-11 h-11 grid place-items-center bg-accent text-white rounded-[12px] hover:bg-accent-strong active:scale-[.96] transition-[background-color,transform]"
        >
          <Icon name="chev" size={18} />
        </button>
      </form>
    </Card>
  );
}
