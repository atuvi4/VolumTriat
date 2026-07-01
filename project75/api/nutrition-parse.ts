/* Serverless (Vercel) — parseig de llenguatge natural amb Nutritionix.
   Ex: "200 g arròs, 150 g pollastre, 15 g oli".
   Requereix NUTRITIONIX_APP_ID i NUTRITIONIX_APP_KEY (privades, al servidor).
   Si no estan configurades → 501 (el frontend usa la base local). */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const appId = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;
  if (!appId || !appKey) {
    return res.status(501).json({ error: 'Nutritionix no configurat (falten claus)', foods: [] });
  }

  const query = req.body?.query;
  if (!query) return res.status(400).json({ error: 'missing body.query' });

  try {
    const r = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': appId,
        'x-app-key': appKey,
      },
      body: JSON.stringify({ query }),
    });
    const data = await r.json();
    return res.status(200).json({ foods: data.foods ?? [] });
  } catch (e: any) {
    return res.status(502).json({ error: 'upstream error', detail: String(e), foods: [] });
  }
}
