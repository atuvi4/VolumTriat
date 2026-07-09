import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import MealCard from '../components/MealCard';
import NutritionAdjustCard from '../components/NutritionAdjustCard';
import ExtraRow from '../components/ExtraRow';
import Button from '../components/Button';
import Icon from '../components/Icon';
import RescueSheet from '../components/sheets/RescueSheet';
import QuickOptionsSheet from '../components/sheets/QuickOptionsSheet';
import CalcSheet from '../components/sheets/CalcSheet';
import ManualEntrySheet from '../components/sheets/ManualEntrySheet';
import PartialSheet from '../components/sheets/PartialSheet';
import MealActionsSheet from '../components/sheets/MealActionsSheet';
import SwapSheet from '../components/sheets/SwapSheet';
import SupplementsCard from '../components/SupplementsCard';
import WeeklyPlannerCard from '../components/WeeklyPlannerCard';
import RelatedAdjustSheet from '../components/sheets/RelatedAdjustSheet';
import { goalsFor, doneKcal, doneProt, doneCount, currentWeight, mealStatus, mealAsManualLog } from '../utils/goals';
import { nutritionAdjust } from '../utils/nutritionAdvice';
import { nf } from '../utils/format';
import { computeTargets } from '../nutrition/nutritionTargets';
import { weeklyAdjustment } from '../nutrition/adjustmentRules';
import { NOCOOK_RECIPES, OUTSIDE_RECIPES } from '../nutrition/mealPlans';
import { CONFIDENCE_LABEL } from '../nutrition/nutritionSources';
import { isStarted } from '../utils/project';
import type { AdjustContext, ManualLog, ResolvedMeal } from '../nutrition/nutritionTypes';

export default function Nutrition() {
  const app = useApp();
  const {
    state, markMeal, changeMeal, partialMeal, skipMeal, undoMeal,
    addExtra, addAdjustment, removeExtra,
    openSheet, closeSheet, addShake, regenerateDay, toggleLowAppetite,
  } = app;
  const started = isStarted(state.profile.projectStartDate);
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const dc = doneCount(state.meals);
  // Un àpat compta com a batut si s'ha menjat (fet/canviat/parcial) i és líquid:
  // per etiqueta (liquid_calories) o pel nom (batut/shake/whey).
  const isShakeMeal = (m: ResolvedMeal) =>
    ['done', 'changed', 'partial'].includes(mealStatus(m)) &&
    (m.tags.includes('liquid_calories') || /batut|shake|whey/i.test([m.name, m.logged?.name].filter(Boolean).join(' ')));
  const shakes = state.meals.filter(isShakeMeal).length;
  const plannedMeals = state.meals.filter((m) => !m.isExtra);
  const extras = state.meals.filter((m) => m.isExtra);

  // Ajustos recomanats relacionats amb un àpat concret.
  const relatedAdjustments = (mealId: string) =>
    state.meals.filter((m) => m.isExtra && m.extraOrigin === 'adjustment' && m.relatedMealId === mealId);

  // Aplica una acció sobre un àpat i, si tenia ajustos relacionats, pregunta si treure'ls.
  // Mai esborra res sol; els extres manuals i batuts no relacionats no es toquen.
  const applyThenMaybePrompt = (meal: ResolvedMeal, apply: () => void) => {
    apply();
    const related = relatedAdjustments(meal.id);
    if (related.length > 0) openSheet(<RelatedAdjustSheet meal={meal} related={related} />);
    else closeSheet();
  };

  // Context per als ajustos afegits des de «Ajust per arribar avui».
  const contextMeal =
    plannedMeals.find((m) => mealStatus(m) === 'skipped') ??
    plannedMeals.find((m) => mealStatus(m) === 'partial') ??
    plannedMeals.find((m) => mealStatus(m) === 'changed');
  const lastPlannedId = plannedMeals[plannedMeals.length - 1]?.id;
  const adjustContext: AdjustContext = contextMeal
    ? {
        relatedMealId: contextMeal.id,
        relatedMealStatus: mealStatus(contextMeal) as 'skipped' | 'partial' | 'changed',
        suggestedAfterMealId: contextMeal.id,
        suggestedTiming: `Per compensar «${contextMeal.slot}»`,
      }
    : { suggestedAfterMealId: lastPlannedId, suggestedTiming: 'Per tancar el dia' };

  // Repartiment d'extres: col·locats sota el seu àpat, o a les seccions del final.
  const plannedIds = new Set(plannedMeals.map((m) => m.id));
  const isPlaced = (e: ResolvedMeal) => !!e.suggestedAfterMealId && plannedIds.has(e.suggestedAfterMealId);
  const looseAdjustments = extras.filter((e) => !isPlaced(e) && e.extraOrigin === 'adjustment');
  const manualExtras = extras.filter((e) => !isPlaced(e) && e.extraOrigin !== 'adjustment');

  const weightKg = currentWeight(state.weights) || state.profile.startWeight;
  const targets = computeTargets({
    sex: state.profile.sex,
    age: state.profile.age,
    heightCm: state.profile.heightCm,
    weightKg,
    ritme: state.profile.ritme,
    goal: state.profile.goal,
  });
  const adj = weeklyAdjustment({
    weights: state.weights,
    weeklyGainTarget: targets.weeklyGain,
    lowAppetite: state.dayMode === 'pocaGana' || state.checkin?.appetite === 'poca',
  });

  const objs = [
    { v: String(dc), gg: `${g.meals}`, l: 'Àpats', ok: dc >= g.meals },
    { v: `${dp}g`, gg: `${g.prot}g`, l: 'Proteïna', ok: dp >= g.prot },
    { v: String(shakes), gg: '1', l: 'Batut', ok: shakes >= 1 },
    { v: nf(dk), gg: nf(g.kcal), l: 'Calories', ok: dk >= g.kcal },
  ];

  const adjust = nutritionAdjust(state);

  // Accions secundàries (dins «Més opcions»). Les principals són inline.
  const moreActions = [
    { icon: 'store' as const, label: 'No vull cuinar', run: () => openSheet(<QuickOptionsSheet title="Sense cuinar" sub="Opcions ràpides sense fogons (calculades):" options={NOCOOK_RECIPES} />) },
    { icon: 'clock' as const, label: 'Menjo fora', run: () => openSheet(<QuickOptionsSheet title="Menjo fora" sub="Orientatiu (precisió baixa): què demanar per sumar calories i proteïna" options={OUTSIDE_RECIPES} />) },
    { icon: 'swap' as const, label: "Canvia'm el dia", run: regenerateDay },
    { icon: 'plus' as const, label: 'Afegir extra', run: () => openSheet(<ManualEntrySheet title="Afegir extra" sub="Alguna cosa que has menjat fora del menú." submitLabel="Afegir extra" onSubmit={(d) => addExtra(d)} />) },
  ];

  return (
    <section>
      <PageHead title="Nutrició" sub="Mode simple · marca, no comptis" />

      {!started && (
        <div className="flex items-center gap-2 bg-warn-soft text-warn rounded-xl2 px-4 py-3 mb-3.5 text-[13.5px] font-semibold">
          <Icon name="info" size={17} /> Preparació: planifica, no cal complir avui.
        </div>
      )}

      {/* 1) Resum del dia — el primer que es veu */}
      <Card title={started ? "Objectiu d'avui" : 'Objectiu de referència'} className="mb-3.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {objs.map((o) => (
            <div key={o.l} className={`rounded-[14px] p-3 border ${started && o.ok ? 'bg-accent-soft border-accent-line' : 'bg-surface2 border-line'}`}>
              <div className={`font-display text-[20px] font-bold tracking-[-0.01em] tnum ${started && o.ok ? 'text-accent-strong' : ''}`}>
                {started ? o.v : o.gg}
              </div>
              <div className={`text-[11.5px] font-semibold mt-0.5 ${started && o.ok ? 'text-accent-strong' : 'text-muted'}`}>{o.l}</div>
              <div className="text-[11px] text-faint font-semibold">{started ? `objectiu ${o.gg}` : 'per dia'}</div>
            </div>
          ))}
        </div>
        {started ? (
          <div className="mt-4">
            <ProgressBar big label="Calories" valueLabel={`${nf(dk)} / ${nf(g.kcal)} kcal`} value={dk} max={g.kcal} />
          </div>
        ) : (
          <p className="text-[13px] text-muted mt-3 mb-0">
            Objectius de referència. Quan comencis, aquí veuràs el que portes al dia.
          </p>
        )}
      </Card>

      {/* 2) Següent moviment — «què faig ara» */}
      {started ? (
        <div className="mb-3.5">
          <NutritionAdjustCard
            adjust={adjust}
            onAddShake={() => addAdjustment(adjustContext)}
            onRescue={() => openSheet(<RescueSheet adjust={adjustContext} />)}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden bg-surface border border-accent-line rounded-xl2 p-4 pl-[18px] mb-3.5">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
          <div className="flex items-center gap-2 font-bold text-[12.5px] text-accent-strong mb-1.5">
            <Icon name="cup" size={16} /> Preparació
          </div>
          <p className="text-[14.5px] leading-relaxed m-0">
            Avui no cal complir calories. Deixa preparat un batut i 2 opcions fàcils.
          </p>
        </div>
      )}

      {/* 3) Menú del dia · cada ajust relacionat es mostra just sota el seu àpat */}
      <div className="text-[11px] uppercase tracking-[0.07em] text-faint font-bold mb-1 px-1">
        {started ? "Menú d'avui" : 'Menú proposat'}
      </div>
      <div>
        {plannedMeals.map((m) => {
          const onChange = (d: ManualLog) => applyThenMaybePrompt(m, () => changeMeal(m.id, d));
          const onPartial = (pct: number) => applyThenMaybePrompt(m, () => partialMeal(m.id, pct));
          const placed = extras.filter((e) => e.suggestedAfterMealId === m.id);
          return (
            <div key={m.id}>
              <MealCard
                meal={m}
                dayMeals={state.meals}
                onSwap={() => openSheet(<SwapSheet meal={m} />)}
                onMarkDone={() => applyThenMaybePrompt(m, () => markMeal(m.id))}
                onOpenOptions={() =>
                  openSheet(
                    <MealActionsSheet
                      meal={m}
                      onChange={onChange}
                      onPartial={onPartial}
                      onSkip={() => applyThenMaybePrompt(m, () => skipMeal(m.id))}
                    />,
                  )
                }
                onUndo={() => applyThenMaybePrompt(m, () => undoMeal(m.id))}
                onEdit={() =>
                  mealStatus(m) === 'partial'
                    ? openSheet(<PartialSheet meal={m} onSave={onPartial} />)
                    : openSheet(
                        <ManualEntrySheet
                          title={`Editar «${m.slot}»`}
                          sub="Ajusta el nom, les calories o la proteïna d'aquest àpat."
                          submitLabel="Desar canvi"
                          initial={mealAsManualLog(m)}
                          closeOnSubmit={false}
                          target={{ kcal: m.nutrition.kcal, protein: m.nutrition.protein }}
                          allowPending
                          defaultEaten
                          onSubmit={onChange}
                        />,
                      )
                }
                onViewCalc={() => openSheet(<CalcSheet meal={m} />)}
              />
              {placed.map((e) => (
                <ExtraRow key={e.id} meal={e} onRemove={() => removeExtra(e.id)} />
              ))}
            </div>
          );
        })}
      </div>

      {/* ajustos recomanats sense àpat concret relacionat */}
      {looseAdjustments.length > 0 && (
        <div className="mt-3.5">
          <div className="text-[11px] uppercase tracking-[0.07em] text-faint font-bold mb-1">Ajustos recomanats d'avui</div>
          {looseAdjustments.map((m) => (
            <ExtraRow key={m.id} meal={m} onRemove={() => removeExtra(m.id)} />
          ))}
        </div>
      )}

      {/* extres manuals */}
      {manualExtras.length > 0 && (
        <div className="mt-3.5">
          <div className="text-[11px] uppercase tracking-[0.07em] text-faint font-bold mb-1">Extres manuals</div>
          {manualExtras.map((m) => (
            <ExtraRow key={m.id} meal={m} onRemove={() => removeExtra(m.id)} />
          ))}
        </div>
      )}

      {/* 4) Accions ràpides — principals visibles, la resta a «Més opcions» */}
      <Card title="Accions ràpides" className="mt-3.5">
        <div className="flex flex-wrap gap-2.5">
          <Button block active={state.dayMode === 'pocaGana'} icon="moon" onClick={toggleLowAppetite}>
            {state.dayMode === 'pocaGana' ? 'Poca gana · actiu' : 'Poca gana'}
          </Button>
          <Button block variant="ghost" icon="cup" onClick={addShake}>Afegir batut</Button>
          <Button block variant="ghost" icon="alert" onClick={() => openSheet(<RescueSheet />)}>Rescat</Button>
        </div>
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[13px] font-semibold text-accent list-none flex items-center gap-1">
            <Icon name="chev" size={14} /> Més opcions
          </summary>
          <div className="flex flex-wrap gap-2 mt-2">
            {moreActions.map((a) => (
              <button
                key={a.label}
                onClick={a.run}
                className="shrink-0 inline-flex items-center gap-2 bg-surface border border-line2 rounded-full px-3.5 py-2.5 text-[13px] font-semibold hover:border-faint"
              >
                <Icon name={a.icon} size={16} /> {a.label}
              </button>
            ))}
          </div>
        </details>
      </Card>

      {/* Suplements: creatina + Anabolic Master (a part dels batuts) */}
      {started && <SupplementsCard />}

      {/* 5) Objectiu calculat (plegat) */}
      <Card className="mt-3.5">
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-bold text-[13.5px] text-accent-strong">
            <Icon name="target" size={16} /> Objectiu: {nf(g.kcal)} kcal · {g.prot} g proteïna
            <Icon name="chev" size={14} className="ml-auto text-muted" />
          </summary>
          <p className="text-[14px] leading-relaxed mt-2 mb-0">{targets.explanation}</p>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[13px]">
            {[
              ['BMR estimat', `${targets.bmr} kcal`],
              ['Manteniment', `~${targets.tdeeMid} kcal`],
              ['Proteïna', `${targets.proteinRange[0]}-${targets.proteinRange[1]} g`],
              ['Greix mínim', `${targets.fatMin} g`],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface2 border border-line rounded-xl px-3 py-2">
                <div className="text-[11px] text-faint font-semibold">{l}</div>
                <div className="font-bold">{v}</div>
              </div>
            ))}
            <p className="col-span-2 md:col-span-4 text-muted m-0 mt-1">{targets.proteinNote}</p>
            <p className="col-span-2 md:col-span-4 text-faint text-[12px] m-0">
              Pujada objectiu: {targets.weeklyGain[0]}-{targets.weeklyGain[1]} kg/setmana. Estimacions amb factor d'activitat aproximat; no és consell mèdic.
            </p>
          </div>
        </details>
      </Card>

      {/* 6) Ajust setmanal recomanat (plegat) */}
      <Card className="mt-3.5">
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-bold text-[13.5px]">
            <Icon name="scale" size={16} className="text-muted" /> Ajust setmanal recomanat
            <Icon name="chev" size={14} className="ml-auto text-muted" />
          </summary>
          <div className="mt-2 font-bold text-[15px]">{adj.title}</div>
          <p className="text-[14px] text-ink/80 mt-1 mb-2">{adj.message}</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
              <Icon name="database" size={12} /> {adj.dataUsed}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface2 border border-line rounded-full px-2.5 py-1">
              <Icon name="info" size={12} /> confiança {CONFIDENCE_LABEL[adj.confidence]}
            </span>
            {adj.deltaKcal !== 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">
                {adj.deltaKcal > 0 ? '+' : ''}{adj.deltaKcal} kcal/dia
              </span>
            )}
          </div>
        </details>
      </Card>

      {/* Productes / API */}
      <div className="mt-4">
        <WeeklyPlannerCard />
      </div>

      <p className="text-[12px] text-faint text-center mt-3">
        Les dades són estimacions per ració (precisió variable, indicada a cada àpat). No és consell mèdic ni nutricional professional.
      </p>
    </section>
  );
}
