import type { AppState, Goal, Recommendation } from '../types';
import { resolveTodayTraining } from '../data/week';
import { goalsFor, doneKcal, doneProt, doneCount, trendPerWeek, MIN_FOR_TREND } from './goals';
import { nf } from './format';

export interface Directive {
  title: string;
  sub: string;
  cta: 'batut' | 'nutri' | 'checkin';
}

/**
 * Coach Brain v1 — motor de regles (sense IA), CONSCIENT DE L'OBJECTIU.
 * Prioritat: seguretat > nutrició (mínim, gana, calories, proteïna) > entrenament > pes.
 * cut = dèficit (baixar greix), maintain = manteniment, bulk = superàvit (pujar).
 * To: professional + amic directe, exigent però comprensiu, zero culpa.
 * Límit: no és consell mèdic; deriva a professional davant de senyals d'alarma.
 */

/** Verb de l'objectiu, per a missatges genèrics. */
function goalVerb(goal: Goal): string {
  return goal === 'cut' ? 'baixar greix' : goal === 'maintain' ? 'mantenir-te' : 'pujar de pes';
}

/** Frase única de "prioritat ara" per al hero del Dashboard. */
export function getDirective(state: AppState): Directive {
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const left = g.kcal - dk;
  const dp = doneProt(state.meals);
  const goal = state.profile.goal;
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;

  if (state.dayMode === 'dificil')
    return {
      title: 'Objectiu mínim: una ingesta fàcil',
      sub: 'Avui no busquem perfecció. Amb això el dia compta i la ratxa segueix.',
      cta: goal === 'cut' ? 'nutri' : 'batut',
    };
  if (state.dayMode === 'pocaGana')
    return {
      title: goal === 'cut' ? 'Menja fàcil, prioritza proteïna' : 'Comença per calories líquides',
      sub:
        goal === 'cut'
          ? 'Poca gana: un àpat lleuger amb proteïna (iogurt proteic, ous) tanca la gana sense passar-te.'
          : 'Dia de poca gana: un batut ara suma molt sense esforç de masticar.',
      cta: goal === 'cut' ? 'nutri' : 'batut',
    };
  if (t.nutritionPriority)
    return {
      title: 'Primer dia: nutrició abans que entrenament',
      sub: "Objectiu real d'avui: ordenar els àpats. Si entrenes, que sigui suau i curt.",
      cta: 'nutri',
    };
  if (doneCount(state.meals) === 0)
    return {
      title: 'Obre el dia amb proteïna',
      sub: `Primera ingesta amb proteïna. Objectiu del dia: ${g.prot} g.`,
      cta: 'nutri',
    };
  if (w.type === 'gym' && dp < g.prot)
    return {
      title: 'Dia de força: assegura la proteïna',
      sub: `Vas per ${dp}/${g.prot} g. Reparteix-la i tanca amb una ingesta post-entreno.`,
      cta: 'nutri',
    };

  // Tail per objectiu.
  if (goal === 'cut') {
    if (dk > g.kcal + 200)
      return { title: 'Pressupost del dia superat', sub: 'Tanca amb proteïna magra o para; demà tornem al dèficit sense drama.', cta: 'nutri' };
    if (dp < g.prot)
      return { title: `Assegura la proteïna: ${dp}/${g.prot} g`, sub: 'En dèficit, la proteïna preserva múscul i sacia. És la prioritat.', cta: 'nutri' };
    return { title: 'Dia sota control', sub: `Dins del pressupost i proteïna coberta. Així es ${goalVerb(goal)} sense perdre múscul.`, cta: 'nutri' };
  }
  if (goal === 'maintain') {
    if (Math.abs(left) <= 250) return { title: 'En equilibri', sub: 'Calories al voltant del manteniment. Manté la proteïna alta i ja està.', cta: 'nutri' };
    if (left > 0) return { title: `Et queden ${nf(left)} kcal`, sub: 'Completa el dia amb una ingesta normal per quedar al manteniment.', cta: 'nutri' };
    return { title: 'Una mica per sobre avui', sub: 'Res greu: demà t’hi tornes a acostar. Mantén la proteïna.', cta: 'nutri' };
  }
  // bulk
  if (left > 500)
    return { title: `Et queden ${nf(left)} kcal`, sub: 'Vas bé. Un batut abans de dormir ho tanca sense esforç.', cta: 'batut' };
  if (left > 0)
    return { title: `Gairebé fet: ${nf(left)} kcal`, sub: 'Un snack dens (fruits secs + iogurt) tanca el dia.', cta: 'nutri' };
  return { title: 'Objectiu del dia cobert', sub: 'Calories i proteïna dins. La constància és el que fa pujar el pes.', cta: 'nutri' };
}

/** Missatge curt per a la card d'insight (Avui i Coach). */
export function getCoachLine(state: AppState): string {
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const left = g.kcal - dk;
  const dp = doneProt(state.meals);
  const goal = state.profile.goal;
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;

  if (state.dayMode === 'dificil')
    return 'Dia difícil, sense culpa. Objectiu mínim: una ingesta fàcil amb proteïna. Amb això el dia ja compta.';
  if (state.dayMode === 'pocaGana')
    return goal === 'cut'
      ? 'Poca gana avui: aprofita per menjar lleuger i amb proteïna. Empenyem el resultat, no el cos.'
      : 'Poca gana avui. Passem a calories líquides: un batut suma sense esforç.';
  if (t.nutritionPriority)
    return 'Primer dia: el que compta és ordenar els àpats. Si entrenes, que sigui suau i curt.';
  if (doneCount(state.meals) === 0)
    return `Primer moviment del dia: una ingesta amb proteïna. Objectiu: ${g.prot} g.`;
  if (w.type === 'gym' && dp < g.prot)
    return `Dia de força: reparteix la proteïna (${dp}/${g.prot} g). Una ingesta post-entreno tanca la recuperació.`;

  if (goal === 'cut') {
    if (dk > g.kcal + 200) return `Avui ja has superat el pressupost (${nf(dk)}/${nf(g.kcal)} kcal). Tanca amb proteïna magra o para pel dia.`;
    if (dp < g.prot) return `En dèficit, la proteïna és la prioritat: ${dp}/${g.prot} g. Et sacia i protegeix el múscul.`;
    return `Bon control: dins del pressupost (${nf(dk)}/${nf(g.kcal)} kcal) i proteïna coberta. Així es baixa greix sense perdre força.`;
  }
  if (goal === 'maintain') {
    if (Math.abs(left) <= 250) return `Equilibri: ${nf(dk)}/${nf(g.kcal)} kcal. Manté la proteïna alta i ja fas el que toca.`;
    if (left > 0) return `Et queden ~${nf(left)} kcal per arribar al manteniment. Una ingesta normal ho tanca.`;
    return `Avui una mica per sobre del manteniment. Res greu; demà t’hi acostes de nou.`;
  }
  // bulk
  if (left > 500) return `Bon ritme. Et queden ~${nf(left)} kcal; un batut abans de dormir ho tanca fàcil.`;
  if (left > 0) return `Gairebé hi ets: ~${nf(left)} kcal per tancar el superàvit. Un snack dens ho resol.`;
  return 'Objectiu cobert avui: calories i proteïna dins. La constància fa pujar el pes.';
}

/** Motor de recomanacions basat en regles per a la pàgina Coach, per objectiu. */
export function getRecommendations(state: AppState): Recommendation[] {
  const items: { p: number; rec: Recommendation }[] = [];
  const g = goalsFor(state);
  const dk = doneKcal(state.meals);
  const dp = doneProt(state.meals);
  const left = g.kcal - dk;
  const goal = state.profile.goal;
  const t = resolveTodayTraining(state.profile.projectStartDate);
  const w = t.workout;
  const hasTrend = state.weights.length >= MIN_FOR_TREND;
  const trend = hasTrend ? trendPerWeek(state.weights) : 0;
  const ci = state.checkin;
  const moodLow = ci?.mood === 'low';
  const energyLow = ci?.energy === 'low';
  const lowApp = ci?.appetite === 'poca' || state.dayMode === 'pocaGana';

  // Canvi de pes NO desitjat segons l'objectiu.
  const unintended =
    hasTrend &&
    (goal === 'bulk' ? trend <= -0.3 : goal === 'cut' ? trend <= -1.2 : Math.abs(trend) >= 0.8);

  // 0. LÍMIT / SEGURETAT — fatiga acumulada o canvi de pes fora de control.
  if ((moodLow && energyLow) || unintended) {
    items.push({
      p: 0,
      rec: {
        id: 'safety',
        tone: 'warn',
        title: 'Avui toca recuperar',
        body: 'Baixa exigència: descansa i menja fàcil. No forcis l’entrenament dur.',
        why: unintended
          ? `El pes es mou massa ràpid respecte al teu objectiu (${goalVerb(goal)}). Ajusta a poc a poc; si no es redreça en uns dies, consulta un professional. Això no és consell mèdic.`
          : 'Ànim i energia baixos alhora demanen recuperar. Si apareix dolor, mareig o ansietat forta, atura’t i consulta un professional. Això no és consell mèdic.',
        dataUsed: unintended ? `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana` : 'Check-in: ànim i energia baixos',
        confidence: 'medium',
        action: state.dayMode !== 'dificil' ? { label: 'Baixar exigència', kind: 'hardDay' } : undefined,
      },
    });
  }

  // 1. Dia difícil / ànim baix → salvar el mínim
  if (state.dayMode === 'dificil') {
    items.push({
      p: 2,
      rec: {
        id: 'hardmin', tone: 'warn', title: 'Salva el mínim del dia',
        body: 'Una ingesta fàcil amb proteïna. Prou per no trencar la ratxa.',
        why: 'Un dia dolent no atura el progrés; abandonar-ne uns quants seguits, sí.',
        dataUsed: 'Estat: dia difícil', confidence: 'high',
        action: goal === 'cut' ? { label: 'Obrir nutrició', kind: 'openNutrition' } : { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  } else if (moodLow) {
    items.push({
      p: 2,
      rec: {
        id: 'mood', tone: 'warn', title: 'Adaptem el dia, sense culpa',
        body: 'Objectiu mínim: una ingesta fàcil. Salvar el mínim ja és guanyar.',
        why: 'Els dies fluixos, protegir el mínim manté la constància, que és el que porta el resultat.',
        dataUsed: 'Check-in: ànim baix', confidence: 'medium',
        action: { label: 'Activar dia difícil', kind: 'hardDay' },
      },
    });
  }

  // 2. Gana baixa
  if (lowApp && state.dayMode !== 'dificil') {
    items.push({
      p: 3,
      rec: {
        id: 'lowapp', tone: 'info',
        title: goal === 'cut' ? 'Menja lleuger i amb proteïna' : 'Passa a calories líquides',
        body: goal === 'cut'
          ? 'Iogurt proteic, ous o gall dindi: proteïna que sacia sense passar-te de calories.'
          : 'Batut de llet + plàtan + civada + crema de cacauet: calories denses sense masticar.',
        why: goal === 'cut'
          ? 'Amb poca gana i objectiu de dèficit, prioritza proteïna abans que calories buides.'
          : 'Amb poca gana, els líquids entren millor i mantenen energia i carbohidrats.',
        dataUsed: 'Estat: poca gana', confidence: 'medium',
        action: goal === 'cut' ? { label: 'Obrir nutrició', kind: 'openNutrition' } : { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  }

  // 3. CALORIES per objectiu
  if (goal === 'bulk' && left >= 300) {
    items.push({
      p: 4,
      rec: {
        id: 'kcalgap', tone: 'accent', title: `Et falten ${nf(left)} kcal`,
        body: 'Solució ràpida: un batut dens abans de dormir (llet + plàtan + civada + crema de cacauet).',
        why: 'Tancar el superàvit cada dia és el que fa pujar el pes; els líquids ho fan fàcil.',
        dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal`, confidence: 'high',
        action: { label: 'Afegir batut', kind: 'addShake' },
      },
    });
  } else if (goal === 'maintain' && Math.abs(left) > 400) {
    items.push({
      p: 4,
      rec: {
        id: 'maintaincal', tone: 'info',
        title: left > 0 ? `Et queden ${nf(left)} kcal` : `Vas ${nf(-left)} kcal per sobre`,
        body: left > 0 ? 'Completa amb una ingesta normal per quedar al manteniment.' : 'Alleugereix el proper àpat; demà t’hi acostes de nou.',
        why: 'El manteniment és quedar-te a prop del target, no clavar-lo cada dia.',
        dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal`, confidence: 'medium',
        action: { label: 'Obrir nutrició', kind: 'openNutrition' },
      },
    });
  } else if (goal === 'cut' && dk > g.kcal + 200) {
    items.push({
      p: 4,
      rec: {
        id: 'cutover', tone: 'warn', title: `Has superat el pressupost (${nf(dk - g.kcal)} kcal de més)`,
        body: 'Tanca el dia amb proteïna magra o para. Un dia per sobre no trenca res; el patró és el que compta.',
        why: 'En dèficit, l’important és la mitjana de la setmana, no clavar cada dia.',
        dataUsed: `Registrat ${nf(dk)} de ${nf(g.kcal)} kcal`, confidence: 'high',
        action: { label: 'Obrir nutrició', kind: 'openNutrition' },
      },
    });
  }

  // 4. PROTEÏNA — universal, encara més important en dèficit i dies de força
  if (dp < g.prot && (goal === 'cut' || (!t.adaptation && w.type === 'gym'))) {
    items.push({
      p: 5,
      rec: {
        id: 'protein', tone: 'accent',
        title: goal === 'cut' ? `Prioritza proteïna: ${dp}/${g.prot} g` : `Dia de força · ${w.label}`,
        body: goal === 'cut'
          ? 'En dèficit, arribar a la proteïna preserva múscul i et sacia. És la palanca principal.'
          : `Prioritza proteïna: ${dp}/${g.prot} g. Una ingesta o batut post-entreno tanca la recuperació.`,
        why: 'La proteïna repartida afavoreix la síntesi muscular i, en dèficit, protegeix la massa magra.',
        dataUsed: `Proteïna ${dp}/${g.prot} g${w.type === 'gym' ? ` · ${w.label}` : ''}`, confidence: 'high',
        action: { label: 'Obrir nutrició', kind: 'openNutrition' },
      },
    });
  } else if (!t.adaptation && w.type === 'run' && (goal !== 'cut' ? left > 0 : true)) {
    items.push({
      p: 6,
      rec: {
        id: 'run', tone: 'info', title: 'Running en zona 2',
        body: 'Suau: pots combinar-lo amb gym el mateix dia. Ajusta hidrats a l’entorn de la sessió.',
        why: 'A intensitat baixa el running conviu amb la força; els hidrats reposen glicogen.',
        dataUsed: `Sessió d'avui: ${w.label}`, confidence: 'medium',
      },
    });
  }

  // 5. TENDÈNCIA de pes segons objectiu (l'ajust fi es fa a Nutrició)
  if (hasTrend && !unintended) {
    if (goal === 'bulk' && trend > -0.5 && trend < 0.2) {
      items.push({
        p: 7,
        rec: {
          id: 'stall', tone: 'info', title: 'El pes no puja al ritme objectiu',
          body: 'Puja +150-250 kcal/dia (un batut extra) i deixa passar una setmana abans de tornar a ajustar.',
          why: 'Es mira el patró de dies, no un sol pesatge. Sense superàvit no hi ha pujada.',
          dataUsed: `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`, confidence: 'medium',
          action: { label: 'Veure ajust a Nutrició', kind: 'openNutrition' },
        },
      });
    } else if (goal === 'cut' && trend > -0.2) {
      items.push({
        p: 7,
        rec: {
          id: 'nocut', tone: 'info', title: 'El pes no baixa al ritme esperat',
          body: 'Revisa el dèficit: baixa una mica les calories o suma activitat. Ajusta poc a poc, una setmana.',
          why: 'Sense dèficit real no hi ha pèrdua de greix; es mira la tendència, no un dia.',
          dataUsed: `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`, confidence: 'medium',
          action: { label: 'Veure ajust a Nutrició', kind: 'openNutrition' },
        },
      });
    } else if (goal === 'maintain' && Math.abs(trend) >= 0.3) {
      items.push({
        p: 7,
        rec: {
          id: 'drift', tone: 'info', title: 'T’estàs desviant del manteniment',
          body: trend > 0 ? 'Baixa una mica les calories per tornar a l’equilibri.' : 'Puja una mica les calories per no baixar de pes.',
          why: 'Mantenir és seguir la tendència a prop de zero; s’ajusta amb petits canvis.',
          dataUsed: `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`, confidence: 'medium',
          action: { label: 'Veure ajust a Nutrició', kind: 'openNutrition' },
        },
      });
    }
  }

  // Fallback positiu (o dades de pes insuficients)
  if (items.length === 0) {
    items.push({
      p: 9,
      rec: {
        id: 'ok', tone: 'accent', title: 'Vas ben encaminat',
        body: hasTrend
          ? `Objectius del dia dins de rang i pes en línia amb ${goalVerb(goal)}. Mantén la constància.`
          : 'Objectius del dia dins de rang. Registra el pes uns dies i podré llegir la teva tendència real.',
        why: 'La regularitat setmanal pesa més que qualsevol dia perfecte aïllat.',
        dataUsed: hasTrend
          ? `Tendència: ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} kg/setmana`
          : `Encara recopilant dades (${state.weights.length}/${MIN_FOR_TREND} pesos)`,
        confidence: 'medium',
      },
    });
  }

  return items.sort((a, b) => a.p - b.p).slice(0, 4).map((i) => i.rec);
}
