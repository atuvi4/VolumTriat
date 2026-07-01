import type { FoodItem } from '../nutritionTypes';

/* BEDCA — Base de Datos Española de Composición de Alimentos.
   No té una API REST pública clara i estable. Opcions d'integració:
   1) Importar un dump/CSV de BEDCA a una taula pròpia (recomanat).
   2) Proxy serverless si s'aconsegueix accés al seu servei SOAP.

   De moment: adaptador PLACEHOLDER. Retorna un resultat marcat
   explícitament com a pendent de verificar (mai dades inventades com a fiables).
   TODO: substituir per lectura real quan hi hagi el dataset. */

export async function searchBedca(query: string): Promise<FoodItem[]> {
  // Encara no connectat: no retornem valors numèrics falsos.
  return [
    {
      id: `bedca:pending:${query.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${query} (BEDCA — pendent)`,
      kcalPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      source: 'placeholder_pending_verification',
      confidence: 'low',
      category: 'other',
    },
  ];
}
