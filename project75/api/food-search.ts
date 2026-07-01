/* Serverless (Vercel) — cerca d'aliments.
   Manté les claus privades AL SERVIDOR (mai al frontend).
   - source=off   → Open Food Facts (públic, sense clau)
   - source=usda  → USDA FoodData Central (necessita USDA_API_KEY)

   Nota: aquest fitxer viu fora de /src i NO es compila amb `npm run build`
   (tsc només inclou src). Vercel el desplega com a funció independent.
   Tipus "any" a propòsit per no dependre de @vercel/node. */

export default async function handler(req: any, res: any) {
  const source = (req.query?.source as string) || 'off';
  const q = (req.query?.q as string) || '';
  if (!q) return res.status(400).json({ error: 'missing query ?q=' });

  try {
    if (source === 'usda') {
      const key = process.env.USDA_API_KEY;
      if (!key) return res.status(501).json({ error: 'USDA_API_KEY no configurada', items: [] });
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&api_key=${key}`;
      const r = await fetch(url);
      const data = await r.json();
      return res.status(200).json({ items: data.foods ?? [] });
    }

    // Open Food Facts (per defecte, públic)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      q,
    )}&search_simple=1&action=process&json=1&page_size=10`;
    const r = await fetch(url);
    const data = await r.json();
    return res.status(200).json({ items: data.products ?? [] });
  } catch (e: any) {
    return res.status(502).json({ error: 'upstream error', detail: String(e), items: [] });
  }
}
