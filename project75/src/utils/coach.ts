import type { AppState, Recommendation } from '../types';
import { resolveTodayTraining } from '../data/week';
import { goalsFor, doneKcal, doneProt, doneCount, trendPerWeek, MIN_FOR_TREND } from './goals';
import { nf } from './format';

export interface Directive {
  title: string;
  sub: string;
  cta: 'batut' | 'nutri' | 'checkin';
}

/**
 * Coach Brain v1 — motor de regles (sense IA).
 * Prioritat: seguretat > nutrició (mínim, gana, calories, proteïna) > entrenament > pes.
 * To: professional + amic directe, exigent però comprensiu, zero culpa,
 * frases curtes i accionables. "Empeny el resultat, no la persona."
 * Límit: no és consell mèdic; deriva a professional davant de senyals d'alarma.
 */

/** Frase única de "prioritat ara" per al hero del Dashboard. */
export function getDirective(state: AppState): Directive {
  const g = goalsFor(state);
  const left = g.kcal - doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;

  if (state.dayMode === 'dificil')
    return {
      title: 'Objectiu mínim: 1 batut + 1 ingesta',
      sub: 'Avui no busquem perfecció. Amb això el dia compta i la ratxa segueix.',
      cta: 'batut',
    };
  if (state.dayMode === 'pocaGana')
    return {
      title: 'Comença per calories líquides',
      sub: 'Dia de poca gana: un batut ara suma molt sense esforç de masticar.',
      cta: 'batut',
    };
  // Setmana d'adaptació amb focus nutrició (p. ex. Dia 1): mai cardio com a prioritat.
  if (t.nutritionPriority)
    return {
      title: 'Primer dia: nutrició abans que entrenament',
      sub: "Objectiu real d'avui: completar el dia menjant. Si entrenes, que sigui suau i curt.",
      cta: 'nutri',
    };
  if (doneCount(state.meals) === 0)
    return {
      title: 'Obre el dia amb proteïna',
      sub: `Primera ingesta: batut + iogurt grec (≈40 g). Objectiu del dia: ${g.prot} g.`,
      cta: 'nutri',
    };
  if (w.type === 'gym' && dp < g.prot)
    return {
      title: 'Dia de força: assegura la proteïna',
      sub: `Vas per ${dp}/${g.prot} g. Reparteix-la i tanca amb una ingesta post-entreno.`,
      cta: 'nutri',
    };
  if (!t.adaptation && (w.type === 'run' || w.type === 'bike' || w.type === 'swim'))
    return {
      title: 'Suma hidrats al voltant del cardio',
      sub: 'Sessió suau (zona 2), compatible amb gym. Un batut evita frenar el volum.',
      cta: 'batut',
    };
  if (left > 500)
    return {
      title: `Et queden ${nf(left)} kcal`,
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
    sub: 'Calories i proteïna dins. La constància és el que et porta de 67 a 75.',
    cta: 'nutri',
  };
}

/** Missatge curt per a la card d'insight (Avui i Coach). */
export function getCoachLine(state: AppState): string {
  const g = goalsFor(state);
  const left = g.kcal - doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;

  if (state.dayMode === 'dificil')
    return 'Dia difícil, sense culpa. Objectiu mínim: 1 batut ara + una ingesta fàcil. Amb això el dia ja compta.';
  if (state.dayMode === 'pocaGana')
    return 'Poca gana avui. Passem a calories líquides: un batut suma sense esforç. Empenyem el resultat, no el cos.';
  if (t.nutritionPriority)
    return "Primer dia: el que compta és completar el dia menjant. Si entrenes, que sigui suau i curt.";
  if (doneCount(state.meals) === 0)
    return `Primer moviment del dia: una ingesta amb proteïna (batut + iogurt grec, ≈40 g). Objectiu: ${g.prot} g.`;
  if (w.type === 'gym' && dp < g.prot)
    return `Dia de força: reparteix la proteïna (${dp}/${g.prot} g). Una ingesta post-entreno tanca la recuperació.`;
  if (left > 500) return `Bon ritme. Et queden ~${nf(left)} kcal; un batut abans de dormir ho tanca fàcil.`;
  if (left > 0) return `Gairebé hi ets: ~${nf(left)} kcal per tancar. Un snack dens ho resol.`;
  return 'Objectiu cobert avui: calories i proteïna dins. Descansa bé; la constància fa la resta.';
}

/** Motor de recomanacions basat en regles per a la pàgina Coach.
 *  Cada recomanació explica: què, per què, quina dada usa i amb quina confiança.
 *  Es prioritzen i es mostren només les més rellevants (nutrició primer). */
export function getRecommendations(state: AppState): Recommendation[] {
  const items: { p: number; rec: Recommendation }[] = [];
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const left = g.kcal - dk;
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;
  const hasTrend = state.weights.length >= MIN_FOR_TREND;
  const trend = hasTrend ? trendPerWeek(state.weights) : 0;
  const ci = state.checkin;
  const moodLow = ci?.mood === 'low';
  const energyLow = ci?.energy === 'low';
  const lowApp = ci?.appetite === 'poca' || state.dayMode === 'pocaGana';
  const rapidLoss = hasTrend && trend <= -0.5;

  // 0. LÍMIT / SEGURETAT — fatiga acumulada o pèrdua de pes ràpida.
  //    No és consell mèdic; baixa exigència i, si cal, deriva a un professional.
  if ((moodLow && energyLow) || rapidLoss) {
    items.push({
      p: 0,
      rec: {
        id: 'safety',
        tone: 'warn',
        title: 'Avui toca recuperar',
        body: 'Baixa exigència: descansa i menja fàcil. No forcis l’entrenament dur.',
        why: rapidLoss
          ? 'Estàs perdent pes quan l’objectiu és pujar-ne. Prioritza menjar i descans; si no es redreça en uns dies, consulta un professional. Això no és consell mèdic.'
          : 'Ànim i energia baixos alhora demanen recuperar. Si apareix dolor, mareig o ansietat forta, atura’t i consulta un professional. Això no és consell mèdic.',
        dataUsed: rapidLoss ? `Tendència: ${trend.toFixed(2)} kg/setmana` : 'Check-in: ànim i energia baixos',
        confidence: 'medium',
        action: state.dayMode !== 'dificil' ? { label: 'Baixar exigència', kind: 'hardDay' } : undefined,
      },
    });
  }

  // 1. Dia difícil actiu → salvar el mínim
  if (state.dayMode === 'dificil') {
    items.push({
      p: 2,
      rec: {
        id: 'hardmin',
        tone: 'warn',
        title: 'Salva el mínim del dia',
        body: '1 batut + 1 ingesta fàcil. Prou per no trencar la ratxa.',
        why: 'Un dia dolent no atura el progrés; abandonar-ne uns quants seguits, sí.',
        dataUsed: 'Estat: dia difícil',
        confidence: 'high',
        action: { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  } else if (moodLow) {
    // Ànim baix (amb energia normal) → adaptar exigència sense culpa
    items.push({
      p: 2,
      rec: {
        id: 'mood',
        tone: 'warn',
        title: 'Adaptem el dia, sense culpa',
        body: 'Passem a objectiu mínim: una ingesta fàcil o un batut. Salvar el mínim ja és guanyar.',
        why: 'Els dies fluixos, protegir el mínim manté la constància, que és el que porta el resultat.',
        dataUsed: 'Check-in: ànim baix',
        confidence: 'medium',
        action: { label: 'Activar dia difícil', kind: 'hardDay' },
      },
    });
  }

  // 2. Gana baixa → calories líquides i aliments fàcils
  if (lowApp && state.dayMode !== 'dificil') {
    items.push({
      p: 3,
      rec: {
        id: 'lowapp',
        tone: 'info',
        title: 'Passa a calories líquides',
        body: 'Batut de llet + plàtan + civada + crema de cacauet: calories denses sense masticar.',
        why: 'Amb poca gana, els líquids entren millor i mantenen energia i carbohidrats.',
        dataUsed: 'Estat: poca gana',
        confidence: 'medium',
        action: { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  }

  // 3. Falten calories → solució de mínima fricció
  if (left >= 300) {
    items.push({
      p: 4,
      rec: {
        id: 'kcalgap',
        tone: 'accent',
        title: `Et falten ${nf(left)} kcal`,
        body: 'Solució ràpida: un batut dens abans de dormir (llet + plàtan + civada + crema de cacauet).',
        why: 'Tancar el superàvit cada dia és el que fa pujar el pes; els líquids ho fan fàcil.',
        dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal`,
        confidence: 'high',
        action: { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  }

  // 4. Entrenament de força → proteïna repartida (no durant l'adaptació: focus nutrició)
  if (!t.adaptation && w.type === 'gym' && dp < g.prot) {
    items.push({
      p: 5,
      rec: {
        id: 'protein',
        tone: 'accent',
        title: `Dia de força · ${w.label}`,
        body: `Prioritza proteïna: ${dp}/${g.prot} g. Una ingesta o batut post-entreno tanca la recuperació.`,
        why: 'La proteïna repartida al llarg del dia afavoreix la síntesi muscular i el creixement.',
        dataUsed: `Proteïna ${dp}/${g.prot} g · ${w.label}`,
        confidence: 'high',
        action: { label: 'Obrir nutrició', kind: 'openNutrition' },
      },
    });
  } else if (!t.adaptation && w.type === 'run' && left > 0) {
    // Running en zona 2 → hidrats i compatibilitat amb el gym
    items.push({
      p: 6,
      rec: {
        id: 'run',
        tone: 'info',
        title: 'Running en zona 2',
        body: 'Suau: pots combinar-lo amb gym el mateix dia. Suma hidrats a l’entorn (plàtan, civada, arròs).',
        why: 'A intensitat baixa el running conviu amb la força; els hidrats reposen glicogen i protegeixen el volum.',
        dataUsed: `Sessió d'avui: ${w.label}`,
        confidence: 'medium',
      },
    });
  }

  // 5. Pes per sota de l'objectiu (tendència fiable; l'ajust fi es fa a Nutrició)
  if (hasTrend && trend > -0.5 && trend < 0.2) {
    items.push({
      p: 7,
      rec: {
        id: 'stall',
        tone: 'info',
        title: 'El pes no puja al ritme objectiu',
        body: 'Puja +150-250 kcal/dia de forma fàcil (un batut extra) i deixa passar una setmana abans de tornar a ajustar.',
        why: 'Es mira el patró de dies, no un sol pesatge. Sense superàvit no hi ha pujada; ajustem poc a poc.',
        dataUsed: `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`,
        confidence: 'medium',
        action: { label: 'Veure ajust a Nutrició', kind: 'openNutrition' },
      },
    });
  }

  // Fallback positiu (o estat de dades de pes insuficients)
  if (items.length === 0) {
    items.push({
      p: 9,
      rec: {
        id: 'ok',
        tone: 'accent',
        title: 'Vas ben encaminat',
        body: hasTrend
          ? 'Objectius del dia dins de rang i pes en línia. Mantén la constància: és el que et porta a 75 kg.'
          : 'Objectius del dia dins de rang. Registra el pes uns dies i podré llegir la teva tendència real.',
        why: 'La regularitat setmanal pesa més que qualsevol dia perfecte aïllat.',
        dataUsed: hasTrend
          ? `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`
          : `Encara recopilant dades (${state.weights.length}/${MIN_FOR_TREND} pesos)`,
        confidence: 'medium',
      },
    });
  }

  // Ordena per prioritat (nutrició/seguretat primer) i mostra només les rellevants.
  return items.sort((a, b) => a.p - b.p).slice(0, 4).map((i) => i.rec);
}
