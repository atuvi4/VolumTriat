import type { AppState, Profile } from '../types';
import { todayISO } from '../utils/date';

/** Perfil neutre per a usuaris nous. Valors editables a Configuració; els
 *  objectius per defecte són segurs (mai 0) perquè la UI no peti. */
export const STARTER_PROFILE: Profile = {
  name: '',
  sex: 'male',
  age: 30,
  heightCm: 175,
  startWeight: 75,
  target1: 75,
  target2: 75,
  kcalGoal: 2200,
  protGoal: 140,
  ritme: 'moderat',
  goal: 'maintain', // per defecte; l'onboarding el sobreescriu
  onboarded: false, // usuari nou → passa per la configuració inicial
  projectStartDate: todayISO(),
};

/** Estat en blanc per a un compte nou: sense historial de cap mena. */
export function emptyState(): AppState {
  return {
    version: 3,
    date: todayISO(),
    streak: 0,
    lastComplete: null,
    dayMode: 'normal',
    meals: [],
    gymDone: false,
    checkin: null,
    dislikes: [],
    weights: [],
    completedDates: [],
    prepDone: [],
    outcomes: [],
    supplements: { creatineDates: [] },
    profile: { ...STARTER_PROFILE },
  };
}
