/* Serverless (Vercel) — detall d'un aliment USDA, ja NORMALITZAT.
   GET /api/food-details?source=usda&id=<fdcId>
   Retorna només dades normalitzades (per 100 g) + font i confiança.
   Sense USDA_API_KEY → 200 amb food:null (el frontend usa la base local).
   Tipus "any" a propòsit per no dependre de @vercel/node. */

function num(foodNutrients: any[], match: string): number {
  const hit = (foodNutrients || []).find((n: any) => {
    const name = (n?.nutrient?.name ?? n?.nutrientName ?? '').toLowerCase();
    return name.includes(match);
  });
  const v = hit?.amount ?? hit?.value ?? 0;
  return typeof v === 'number' ? v : 0;
}

export default async function handler(req: any, res: any) {
  const source = (req.query?.source as string) || 'usda';
  const id = (req.query?.id as string) || '';
  if (!id) return res.status(400).json({ error: 'missing ?id=', food: null });
  if (source !== 'usda') return res.status(400).json({ error: 'unsupported source', food: null });

  const key = process.env.USDA_API_KEY;
  if (!key) return res.status(200).json({ food: null, note: 'USDA_API_KEY absent — base local' });

  try {
    const r = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(id)}?api_key=${key}`);
    if (!r.ok) return res.status(200).json({ food: null });
    const d: any = await r.json();
    const fn = d.foodNutrients ?? [];
    const food = {
      id: `usda:${d.fdcId ?? id}`,
      name: d.description ?? 'Aliment',
      kcalPer100g: num(fn, 'energy'),
      proteinPer100g: num(fn, 'protein'),
      carbsPer100g: num(fn, 'carbohydrate'),
      fatPer100g: num(fn, 'total lipid'),
      fiberPer100g: num(fn, 'fiber'),
      source: 'usda',
      sourceId: String(d.fdcId ?? id),
      confidence: 'high',
    };
    return res.status(200).json({ food });
  } catch (e: any) {
    return res.status(200).json({ food: null, detail: String(e) });
  }
}
