import type { AppState, Recommendation } from '../types';
import { todayWorkout } from '../data/week';
import { goalsFor, doneKcal, doneProt, doneCount, trendPerWeek, MIN_FOR_TREND } from './goals';
import { nf } from './format';

export interface Directive {
  title: string;
  sub: string;
  cta: 'batut' | 'nutri' | 'checkin';
}

/** Frase única de "prioritat ara" per al hero del Dashboard. */
export function getDirective(state: AppState): Directive {
  const g = goalsFor(state);
  const left = g.kcal - doneKcal(state.meals);
  const w = todayWorkout();

  if (state.dayMode === 'dificil')
    return {
      title: 'Objectiu mínim: 1 batut + 1 ingesta',
      sub: 'Avui no busquem perfecció. Amb això, el dia compta i la ratxa segueix.',
      cta: 'batut',
    };
  if (state.dayMode === 'pocaGana')
    return {
      title: 'Comença per calories líquides',
      sub: 'Dia de baixa gana. Un batut ara suma molt sense esforç de masticar.',
      cta: 'batut',
    };
  if (doneCount(state.meals) === 0)
    return {
      title: 'Completa una ingesta amb proteïna',
      sub: `Prioritat ara. Opció ràpida: batut + iogurt grec (≈40 g). Objectiu del dia: ${g.prot} g.`,
      cta: 'nutri',
    };
  if (w.type === 'run' || w.type === 'bike' || w.type === 'swim')
    return {
      title: 'Compensa el cardio amb un batut',
      sub: 'Has cremat de més amb la sessió. Suma calories líquides per no frenar el volum.',
      cta: 'batut',
    };
  if (left > 500)
    return {
      title: `Et queden ${nf(left)} kcal per l'objectiu`,
      sub: 'Vas bé. Un batut abans de dormir ho tanca sense esforç.',
      cta: 'batut',
    };
  if (left > 0)
    return {
      title: `Gairebé fet: ${nf(left)} kcal`,
      sub: 'Un snack dens (fruits secs + iogurt) tanca el dia.',
      cta: 'nutri',
    };
  return {
    title: 'Objectiu del dia cobert',
    sub: 'Calories i proteïna dins. Mantén la constància: així es passa de 67 a 75.',
    cta: 'nutri',
  };
}

/** Missatge curt per a la card d'insight (Avui i Coach). */
export function getCoachLine(state: AppState): string {
  const g = goalsFor(state);
  const left = g.kcal - doneKcal(state.meals);
  if (state.dayMode === 'dificil')
    return 'Mode dia difícil. Objectiu mínim: 1 batut ara + una ingesta fàcil. Amb això el dia compta.';
  if (state.dayMode === 'pocaGana')
    return 'Dia de baixa gana detectat. Canviem a calories líquides i objectiu mínim. Comença per un batut.';
  if (doneCount(state.meals) === 0)
    return 'Prioritat ara: completa una ingesta amb proteïna. Opció ràpida: batut + iogurt grec (≈40 g).';
  if (left > 500) return `Bon ritme. Et queden ~${nf(left)} kcal: un batut abans de dormir ho tanca fàcil.`;
  if (left > 0) return `Gairebé hi ets: ~${nf(left)} kcal per tancar. Un snack dens ho resol.`;
  return 'Objectiu cobert avui. Calories i proteïna dins. Descansa i demà seguim.';
}

/** Motor de recomanacions basat en regles per a la pàgina Coach.
 *  Cada recomanació explica: què, per què, quina dada usa i amb quina confiança. */
export function getRecommendations(state: AppState): Recommendation[] {
  const recs: Recommendation[] = [];
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const left = g.kcal - dk;
  const w = todayWorkout();
  const hasTrend = state.weights.length >= MIN_FOR_TREND;
  const trend = hasTrend ? trendPerWeek(state.weights) : 0;
  const ci = state.checkin;

  // 1. Ànim baix → adaptar dificultat (NO és consell mèdic)
  if (ci?.mood === 'low' && state.dayMode !== 'dificil') {
    recs.push({
      id: 'anxiety',
      tone: 'warn',
      title: 'Adaptem el dia',
      body: 'Passem a objectiu mínim i to suau perquè no abandonis. Prioritat: una ingesta fàcil o un batut.',
      why: 'Els dies baixos, mantenir el mínim protegeix la constància, que és el que porta resultats.',
      dataUsed: 'Check-in: ànim baix',
      confidence: 'medium',
      action: { label: 'Activar dia difícil', kind: 'hardDay' },
    });
  }

  // 2. Gana baixa → calories líquides
  if ((ci?.appetite === 'poca' || state.dayMode === 'pocaGana') && state.dayMode !== 'dificil') {
    recs.push({
      id: 'lowapp',
      tone: 'info',
      title: 'Passa a calories líquides',
      body: 'Un batut de llet + plàtan + civada + crema de cacauet suma calories sense esforç de masticar.',
      why: 'Amb poca gana, els líquids són més fàcils d’ingerir i aporten energia i carbohidrats.',
      dataUsed: 'Estat: poca gana',
      confidence: 'medium',
      action: { label: 'Afegir batut', kind: 'addShake' },
    });
  }

  // 3. Falten calories → batut/snack
  if (left >= 300) {
    recs.push({
      id: 'kcalgap',
      tone: 'accent',
      title: `Et falten ${nf(left)} kcal per l'objectiu`,
      body: 'Opció ràpida: batut de llet + plàtan + civada + crema de cacauet abans de dormir.',
      why: 'Suma calories líquides (útil si hi ha poca gana) i aporta carbohidrats i greixos densos.',
      dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal objectiu`,
      confidence: 'high',
      action: { label: 'Afegir batut', kind: 'addShake' },
    });
  }

  // 4. Entrenament fort (gym) → prioritzar proteïna / post-entreno
  if (w.type === 'gym' && dp < g.prot) {
    recs.push({
      id: 'protein',
      tone: 'accent',
      title: `Dia de força · ${w.label}`,
      body: `Prioritza la proteïna: vas per ${dp} de ${g.prot} g. Una ingesta o batut post-entreno ajuda a recuperar i créixer.`,
      why: 'Els dies d’entrenament de força, la proteïna repartida afavoreix la síntesi muscular.',
      dataUsed: `Proteïna ${dp}/${g.prot} g · avui: ${w.label}`,
      confidence: 'high',
      action: { label: 'Obrir nutrició', kind: 'openNutrition' },
    });
  } else if ((w.type === 'run' || w.type === 'bike') && left > 0) {
    recs.push({
      id: 'cardio',
      tone: 'info',
      title: 'Carbohidrats al voltant del cardio',
      body: 'Afegeix hidrats abans/després de la sessió (plàtan, civada, arròs) per rendir i recuperar.',
      why: 'El cardio consumeix glicogen; reposar-lo protegeix el volum i el rendiment.',
      dataUsed: `Sessió d'avui: ${w.label}`,
      confidence: 'medium',
    });
  }

  // 5. Pes no puja → afegir 150-250 kcal/dia (només amb tendència fiable)
  if (hasTrend && trend < 0.2) {
    recs.push({
      id: 'stall',
      tone: 'info',
      title: 'El pes puja per sota de l’objectiu',
      body: 'Puja +150-250 kcal/dia de forma fàcil (un batut extra diari) i revisem la tendència en una setmana.',
      why: 'Sense superàvit no hi ha pujada; ajustem poc a poc per no acumular greix.',
      dataUsed: `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`,
      confidence: 'medium',
      action: { label: 'Registrar pes', kind: 'addWeight' },
    });
  }

  // fallback positiu
  if (recs.length === 0) {
    recs.push({
      id: 'ok',
      tone: 'accent',
      title: 'Vas ben encaminat',
      body: hasTrend
        ? 'Objectius del dia dins de rang i tendència a l’alça. Mantén la constància: és el que et porta a 75 kg.'
        : 'Objectius del dia dins de rang. Registra el pes uns quants dies i podré llegir la teva tendència real.',
      why: 'La regularitat setmanal pesa més que qualsevol dia perfecte aïllat.',
      dataUsed: hasTrend
        ? `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`
        : `Encara recopilant dades de pes (${state.weights.length}/${MIN_FOR_TREND} registres)`,
      confidence: 'medium',
    });
  }

  return recs;
}
