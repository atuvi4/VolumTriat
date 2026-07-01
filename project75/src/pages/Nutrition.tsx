import { useApp } from '../hooks/useAppState';
import PageHead from '../components/PageHead';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import MealCard from '../components/MealCard';
import CoachRecommendation from '../components/CoachRecommendation';
import Button from '../components/Button';
import Icon from '../components/Icon';
import SwapSheet from '../components/sheets/SwapSheet';
import RescueSheet from '../components/sheets/RescueSheet';
import QuickOptionsSheet from '../components/sheets/QuickOptionsSheet';
import CalcSheet from '../components/sheets/CalcSheet';
import { goalsFor, doneKcal, doneProt, doneCount, currentWeight } from '../utils/goals';
import { nf, kilo } from '../utils/format';
import { computeTargets } from '../nutrition/nutritionTargets';
import { weeklyAdjustment } from '../nutrition/adjustmentRules';
import { NOCOOK_RECIPES, OUTSIDE_RECIPES } from '../nutrition/mealPlans';
import { CONFIDENCE_LABEL } from '../nutrition/nutritionSources';
import { isStarted } from '../utils/project';
import type { Recommendation } from '../types';

export default function Nutrition() {
  const app = useApp();
  const { state, markMeal, dislikeMeal, openSheet, addShake, regenerateDay, toggleLowAppetite, setDayMode, showToast } = app;
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const dc = doneCount(state.meals);
  const shakes = state.meals.filter((m) => m.done && m.tags.includes('liquid_calories')).length;
  const left = g.kcal - dk;

  const weightKg = currentWeight(state.weights) || state.profile.startWeight;
  const targets = computeTargets({
    sex: state.profile.sex,
    age: state.profile.age,
    heightCm: state.profile.heightCm,
    weightKg,
    ritme: state.profile.ritme,
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
    { v: kilo(dk), gg: kilo(g.kcal), l: 'Calories', ok: dk >= g.kcal },
  ];

  const gapRec: Recommendation = {
    id: 'gap',
    tone: 'accent',
    title: `Et falten ~${nf(left)} kcal`,
    body: 'Opció ràpida i de mínima fricció: un batut dens abans de dormir (llet + plàtan + civada + crema de cacauet).',
    why: 'Suma calories líquides —útil si hi ha poca gana— amb carbohidrats i greixos per recuperar.',
    dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal`,
    confidence: 'high',
    action: { label: 'Afegir batut', kind: 'addShake' },
  };

  const quick = [
    { icon: 'x' as const, label: 'No tinc gana', run: () => { setDayMode('pocaGana'); showToast('Mode poca gana: prioritzo líquids'); } },
    { icon: 'store' as const, label: 'No vull cuinar', run: () => openSheet(<QuickOptionsSheet title="Sense cuinar" sub="Opcions ràpides sense fogons (calculades):" options={NOCOOK_RECIPES} />) },
    { icon: 'clock' as const, label: 'Menjo fora', run: () => openSheet(<QuickOptionsSheet title="Menjo fora" sub="Orientatiu (precisió baixa): què demanar per sumar calories i proteïna" options={OUTSIDE_RECIPES} />) },
    { icon: 'cup' as const, label: 'Només vull batut', run: addShake },
    { icon: 'swap' as const, label: "Canvia'm el dia", run: regenerateDay },
  ];

  return (
    <section>
      <PageHead
        title="Nutrició"
        sub="Mode simple · marca, no comptis"
        right={
          <span className="inline-flex bg-[#EDEFF2] rounded-[11px] p-[3px]">
            <button className="px-3.5 py-2 rounded-[9px] font-semibold text-[13px] bg-white shadow-card">Simple</button>
            <button className="px-3.5 py-2 rounded-[9px] font-semibold text-[13px] text-muted" onClick={() => showToast('Mode precís (grams i macros editables) — arriba a V2')}>Precís</button>
          </span>
        }
      />

      {!isStarted(state.profile.projectStartDate) && (
        <div className="flex items-center gap-2 bg-warn-soft text-warn rounded-xl2 px-4 py-3 mb-3.5 text-[13.5px] font-semibold">
          <Icon name="info" size={17} /> Fase de preparació: això és per planificar i triar què menjaràs, no per complir avui.
        </div>
      )}

      {/* Objectiu calculat */}
      <div className="relative overflow-hidden bg-surface border border-accent-line rounded-xl2 p-4 pl-[18px] mb-3.5">
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
        <div className="flex items-center gap-2 font-bold text-[12.5px] text-accent-strong mb-1.5">
          <Icon name="target" size={16} /> Objectiu calculat
        </div>
        <p className="text-[14.5px] leading-relaxed m-0">{targets.explanation}</p>
        <details className="mt-2 group">
          <summary className="cursor-pointer text-[13px] font-semibold text-accent list-none flex items-center gap-1">
            <Icon name="info" size={14} /> Per què aquest objectiu?
          </summary>
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
      </div>

      {/* accions ràpides */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-[18px] px-[18px] md:mx-0 md:px-0 md:flex-wrap">
        {quick.map((q) => (
          <button
            key={q.label}
            onClick={q.run}
            className="shrink-0 inline-flex items-center gap-2 bg-surface border border-line2 rounded-full px-3.5 py-2.5 text-[13px] font-semibold hover:border-faint"
          >
            <Icon name={q.icon} size={16} /> {q.label}
          </button>
        ))}
      </div>

      <Card title="Objectiu d'avui" className="mb-3.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {objs.map((o) => (
            <div key={o.l} className={`rounded-[14px] p-3 border ${o.ok ? 'bg-accent-soft border-accent-line' : 'bg-surface2 border-line'}`}>
              <div className={`text-[19px] font-extrabold tracking-[-0.02em] ${o.ok ? 'text-accent-strong' : ''}`}>{o.v}</div>
              <div className={`text-[11.5px] font-semibold mt-0.5 ${o.ok ? 'text-accent-strong' : 'text-muted'}`}>{o.l}</div>
              <div className="text-[11px] text-faint font-semibold">objectiu {o.gg}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <ProgressBar big label="Calories" valueLabel={`${nf(dk)} / ${nf(g.kcal)} kcal`} value={dk} max={g.kcal} />
        </div>
      </Card>

      {left >= 300 && (
        <div className="mb-3.5">
          <CoachRecommendation rec={gapRec} onAction={() => addShake()} />
        </div>
      )}

      {/* àpats */}
      <div>
        {state.meals.map((m) => (
          <MealCard
            key={m.id}
            meal={m}
            onComplete={() => markMeal(m.id)}
            onSwap={() => openSheet(<SwapSheet meal={m} />)}
            onDislike={() => dislikeMeal(m.id)}
            onViewCalc={() => openSheet(<CalcSheet meal={m} />)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5 mt-3.5">
        <Button block variant="ghost" icon="cup" onClick={addShake}>Afegir batut</Button>
        <Button block active={state.dayMode === 'pocaGana'} icon="moon" onClick={toggleLowAppetite}>
          {state.dayMode === 'pocaGana' ? 'Poca gana · actiu' : 'Poca gana'}
        </Button>
        <Button block variant="ghost" icon="alert" onClick={() => openSheet(<RescueSheet />)}>Rescat</Button>
      </div>

      {/* Ajust setmanal recomanat */}
      <Card title="Ajust setmanal recomanat" className="mt-3.5">
        <div className="font-bold text-[15px]">{adj.title}</div>
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
      </Card>

      {/* Productes / API */}
      <Card className="mt-3.5 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[14px]">
            <Icon name="database" size={17} className="text-muted" /> Cercar productes i escanejar codis
          </div>
          <span className="text-[11px] font-bold text-info bg-info-soft px-2.5 py-1 rounded-full">Properament</span>
        </div>
        <p className="text-[13px] text-muted m-0 mt-2">
          Integracions preparades amb Open Food Facts, USDA i (futur) llenguatge natural. S'activen en desplegar el backend.
        </p>
      </Card>

      <p className="text-[12px] text-faint text-center mt-3">
        Les dades són estimacions per ració (precisió variable, indicada a cada àpat). No és consell mèdic ni nutricional professional.
      </p>
    </section>
  );
}
