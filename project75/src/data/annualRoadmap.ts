import type { AppState } from '../types';
import { isStarted, projectDay } from '../utils/project';

/* =========================================================
   Annual Roadmap v1 — macrocicle de 12 mesos.
   Guia de direcció del projecte, NO planificació rígida.
   No canvia rutina ni menú; només orienta on som i cap on anem.
   ========================================================= */

export interface RoadmapPhase {
  id: string;
  /** Ordre 1..5. */
  order: number;
  name: string;
  durationLabel: string;
  /** Setmana acumulada (aprox.) on acaba la fase — per situar la fase actual sense rigidesa. */
  approxEndWeek: number;
  /** Resum curt de la fase. */
  goal: string;
  objectives: string[];
  nutritionFocus: string;
  trainingFocus: string;
  /** Etiquetes curtes per a la vista compacta (pills). */
  nutritionShort?: string;
  trainingShort?: string;
  /** Advertiments: què NO forçar encara. */
  cautions: string[];
  /** Progressió d'entrada de bici/natació dins la fase (microdosi, no rígid). */
  microProgression?: { weeks: string; text: string }[];
  /** Textos orientatius curts (to: aviat però sense pressió). */
  notes?: string[];
}

export const ANNUAL_ROADMAP: RoadmapPhase[] = [
  {
    id: 'p1-arrencada',
    order: 1,
    name: 'Arrencada · volum inicial',
    durationLabel: '8-12 setmanes',
    approxEndWeek: 12,
    goal: 'Consolidar la nutrició i començar a pujar de pes.',
    objectives: [
      'Consolidar la nutrició (superàvit sostenible).',
      'Pujar pes cap als 75 kg.',
      'Mantenir gym 4-5 dies/setmana.',
      'Running zona 2 opcional.',
    ],
    nutritionFocus: 'La nutrició mana: superàvit sostenible i proteïna alta cada dia.',
    trainingFocus: 'Gym 4-5 dies + running zona 2 opcional. Bici/natació entren aviat, en microdosi tècnica.',
    nutritionShort: 'Nutrició mana',
    trainingShort: 'Gym + running',
    cautions: [
      'Bici i natació en microdosi tècnica, no com a cardio dur.',
      'Busca constància, no rendiment aeròbic.',
    ],
    microProgression: [
      { weeks: 'Setmanes 1-2', text: 'Consolidar nutrició, gym i running suau. Encara sense bici/natació.' },
      { weeks: 'Setmanes 3-6', text: '1 contacte setmanal opcional amb bici o natació.' },
      { weeks: 'Setmanes 7-12', text: 'Si pes i gana van bé: 1 bici suau + 1 natació tècnica per setmana.' },
    ],
    notes: [
      'Bici i natació entren aviat, però en microdosi.',
      'Primer contacte, no rendiment.',
      'Natació = tècnica i respiració.',
      'Bici = confiança i temps fàcil sobre la bici.',
      'Si el pes no puja o la gana baixa, no afegim més cardio.',
    ],
  },
  {
    id: 'p2-volum-consolidat',
    order: 2,
    name: 'Volum consolidat',
    durationLabel: '3-4 mesos',
    approxEndWeek: 29,
    goal: 'Apropar-se a 75 kg mantenint la força.',
    objectives: [
      'Apropar-se a 75 kg.',
      'Mantenir la força al gym.',
      'Running 1-2 dies/setmana.',
      'Bici/natació només com a contacte opcional.',
    ],
    nutritionFocus: 'Superàvit controlat i proteïna alta per seguir pujant amb qualitat.',
    trainingFocus: 'Gym prioritari + running 1-2 dies.',
    nutritionShort: 'Superàvit',
    trainingShort: 'Gym + running',
    cautions: ['Bici/natació només de contacte, sense pla.', 'No canviïs el focus a resistència encara.'],
  },
  {
    id: 'p3-base-hibrida',
    order: 3,
    name: 'Base híbrida',
    durationLabel: '3 mesos',
    approxEndWeek: 42,
    goal: 'Mantenir el pes guanyat i obrir capacitat aeròbica.',
    objectives: [
      'Mantenir el pes guanyat.',
      'Millorar la capacitat aeròbica.',
      'Integrar bici/natació progressivament.',
      'No perdre massa muscular.',
    ],
    nutritionFocus: 'Manteniment (o superàvit lleuger) amb proteïna alta per protegir el múscul.',
    trainingFocus: 'Gym + aeròbic progressiu (running/bici/natació suau).',
    nutritionShort: 'Manteniment',
    trainingShort: 'Gym + aeròbic',
    cautions: ['Introdueix bici/natació poc a poc.', 'Vigila no perdre massa muscular.'],
  },
  {
    id: 'p4-construccio-triatlo',
    order: 4,
    name: 'Construcció triatló',
    durationLabel: '2-3 mesos',
    approxEndWeek: 55,
    goal: 'Entrenament més específic de les tres disciplines.',
    objectives: [
      'Entrenar específicament running/bici/natació.',
      'Ajustar el gym perquè no interfereixi.',
      'Nutrició orientada a mantenir pes i rendir.',
    ],
    nutritionFocus: 'Prou hidrats per rendir, mantenint pes i proteïna.',
    trainingFocus: 'Càrrega específica de triatló; gym de manteniment.',
    nutritionShort: 'Rendir + mantenir',
    trainingShort: 'Triatló',
    cautions: ['El gym passa a manteniment, no a pujada.', 'Gestiona la fatiga acumulada.'],
  },
  {
    id: 'p5-especifica-test',
    order: 5,
    name: 'Específica / test',
    durationLabel: '6-8 setmanes abans de la prova',
    approxEndWeek: 63,
    goal: 'Arribar fresc i rendir el dia de la prova.',
    objectives: [
      'Arribar fresc a la prova.',
      'Sense canvis radicals.',
      'Practicar combinacions i nutrició de rendiment.',
      'Mantenir massa i evitar fatiga excessiva.',
    ],
    nutritionFocus: 'Nutrició de rendiment ja provada; mantenir massa.',
    trainingFocus: 'Afinar i baixar volum abans de la prova (tapering).',
    nutritionShort: 'Rendiment provat',
    trainingShort: 'Tapering',
    cautions: ['No facis canvis radicals ara.', 'Evita la fatiga excessiva.'],
  },
];

/** Fase actual del macrocicle. Càlcul lleuger per setmana del projecte;
 *  abans de començar (o durant les primeres setmanes) → Fase 1. */
export function currentPhase(state: AppState): RoadmapPhase {
  const start = state.profile.projectStartDate;
  if (!isStarted(start)) return ANNUAL_ROADMAP[0];
  const week = Math.ceil(projectDay(start) / 7);
  return ANNUAL_ROADMAP.find((p) => week <= p.approxEndWeek) ?? ANNUAL_ROADMAP[ANNUAL_ROADMAP.length - 1];
}
