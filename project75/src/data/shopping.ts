export interface ShoppingGroup {
  title: string;
  items: string[];
}

/** Compra inicial Project75 — base per volum. Editable més endavant. */
export const SHOPPING_LIST: ShoppingGroup[] = [
  {
    title: 'Proteïnes',
    items: ['Ous', 'Pit de pollastre', 'Tonyina en llauna', 'Iogurt grec', 'Llet', 'Whey (opcional)'],
  },
  {
    title: 'Hidrats',
    items: ['Arròs', 'Pasta', 'Pa', 'Civada', 'Patata', 'Plàtans', 'Cereals'],
  },
  {
    title: 'Calories fàcils',
    items: ["Oli d'oliva", 'Fruits secs', 'Crema de cacauet', 'Mel', 'Formatge'],
  },
  {
    title: 'Snacks / batuts',
    items: ['Llet', 'Plàtan', 'Civada', 'Crema de cacauet', 'Iogurt grec'],
  },
];
