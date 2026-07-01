/* Serverless (Vercel) — producte per codi de barres via Open Food Facts (públic).
   Futur: escaneig amb la càmera al frontend → crida aquí amb el codi. */

export default async function handler(req: any, res: any) {
  const code = (req.query?.code as string) || '';
  if (!code) return res.status(400).json({ error: 'missing ?code=' });

  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
    const data = await r.json();
    if (data.status !== 1) return res.status(404).json({ error: 'product not found', product: null });
    return res.status(200).json({ product: data.product });
  } catch (e: any) {
    return res.status(502).json({ error: 'upstream error', detail: String(e), product: null });
  }
}
