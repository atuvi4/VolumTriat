export const todayISO = (): string => new Date().toISOString().slice(0, 10);

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
