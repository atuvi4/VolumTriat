export const fmt1 = (kg: number): string => kg.toFixed(1).replace('.', ',');
export const nf = (n: number): string => n.toLocaleString('ca-ES');
export const kilo = (n: number): string => (n / 1000).toFixed(1).replace('.', ',') + 'k';
export const pct = (v: number, max: number): number => Math.max(0, Math.min(100, (v / max) * 100));
