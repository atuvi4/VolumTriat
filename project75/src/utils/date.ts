/** Data en hora LOCAL en format YYYY-MM-DD (evita el desfasament d'UTC de toISOString). */
export const toLocalISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayISO = (): string => toLocalISO(new Date());

/** Suma (o resta) dies a una data ISO local. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

const DIES = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
const MESOS = [
  'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
  'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre',
];

export function longDate(d = new Date()): string {
  const s = `${DIES[d.getDay()]} ${d.getDate()} de ${MESOS[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function greetName(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return 'Bona nit';
  if (h < 14) return 'Bon dia';
  if (h < 21) return 'Bona tarda';
  return 'Bona nit';
}

export function shortDate(iso: string): string {
  return iso.slice(8, 10) + '/' + iso.slice(5, 7);
}
