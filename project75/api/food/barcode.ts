/* Backend Nutrition Pro v1 — producte per codi de barres (Open Food Facts).
   GET /api/food/barcode?barcode=...
   Públic (sense clau). User-Agent propi. Normalitza nutrients bàsics.
   Si el producte no existeix o falta info → item:null / confidence baixa.
   Fora de /src: no es type-checka al build. */

const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);

export default async function handler(req: any, res: any) {
  const barcode = String(req.query?.barcode ?? req.query?.code ?? '').trim();
  if (!barcode) return res.status(400).json({ item: null, error: 'missing ?barcode=' });

  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { headers: { 'User-Agent': 'Project75/1.0' } },
    );
    if (!r.ok) return res.status(200).json({ item: null });
    const d: any = await r.json();
    if (d.status !== 1 || !d.product) return res.status(200).json({ item: null });

    const p = d.product;
    const n = p.nutriments ?? {};
    const kcal = n['energy-kcal_100g'];
    const hasKcal = typeof kcal === 'number';

    const item = {
      externalId: `off:${p.code ?? barcode}`,
      name: p.product_name || 'Producte',
      brand: p.brands || undefined,
      source: 'OpenFoodFacts' as const,
      kcalPer100g: num(kcal),
      proteinPer100g: num(n['proteins_100g']),
      carbsPer100g: num(n['carbohydrates_100g']),
      fatPer100g: num(n['fat_100g']),
      // Sense energia fiable → confiança baixa.
      confidence: (hasKcal ? 'medium' : 'low') as 'medium' | 'low',
    };
    return res.status(200).json({ item });
  } catch (e: any) {
    return res.status(200).json({ item: null, error: 'upstream', detail: String(e) });
  }
}
