/* Backend Nutrition Pro v1 — cerca d'aliments NORMALITZADA.
   GET /api/food/search?query=...&source=usda|off|all
   - USDA (genèrics) via USDA_API_KEY (només servidor)
   - Open Food Facts (comercials) — públic, sense clau
   - Cache opcional a Supabase (api_food_cache) si hi ha env; si no, s'ignora.
   Sense claus / errors → items:[] (el frontend cau a la base local).
   Fora de /src: no es type-checka al build. Tipus "any" a propòsit. */

type ProItem = {
  externalId: string;
  name: string;
  brand?: string;
  source: 'USDA' | 'OpenFoodFacts';
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  confidence: 'high' | 'medium' | 'low';
  raw?: any;
};

const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);

function usdaNutrient(fn: any[], match: string): number {
  const hit = (fn || []).find((n: any) =>
    (n?.nutrientName ?? n?.nutrient?.name ?? '').toLowerCase().includes(match),
  );
  return num(hit?.value ?? hit?.amount);
}

function mapUsda(f: any): ProItem | null {
  if (!f?.description) return null;
  const fn = f.foodNutrients ?? [];
  return {
    externalId: `usda:${f.fdcId ?? f.description}`,
    name: f.description,
    brand: f.brandOwner || undefined,
    source: 'USDA',
    kcalPer100g: usdaNutrient(fn, 'energy'),
    proteinPer100g: usdaNutrient(fn, 'protein'),
    carbsPer100g: usdaNutrient(fn, 'carbohydrate'),
    fatPer100g: usdaNutrient(fn, 'total lipid'),
    confidence: 'high',
  };
}

function mapOff(p: any): ProItem | null {
  const n = p?.nutriments ?? {};
  const kcal = n['energy-kcal_100g'];
  if (!p?.product_name) return null;
  const hasKcal = typeof kcal === 'number';
  return {
    externalId: `off:${p.code ?? p.product_name}`,
    name: p.product_name,
    brand: p.brands || undefined,
    source: 'OpenFoodFacts',
    kcalPer100g: num(kcal),
    proteinPer100g: num(n['proteins_100g']),
    carbsPer100g: num(n['carbohydrates_100g']),
    fatPer100g: num(n['fat_100g']),
    confidence: hasKcal ? 'medium' : 'low',
  };
}

/* ---------- Cache Supabase opcional (REST, sense SDK) ---------- */
function sbConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

async function cacheGet(cacheKey: string): Promise<ProItem[] | null> {
  const cfg = sbConfig();
  if (!cfg) return null;
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/api_food_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=payload`,
      { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } },
    );
    if (!r.ok) return null;
    const rows: any = await r.json();
    return rows?.[0]?.payload?.items ?? null;
  } catch {
    return null;
  }
}

async function cacheSet(cacheKey: string, source: string, query: string, items: ProItem[]) {
  const cfg = sbConfig();
  if (!cfg) return;
  try {
    await fetch(`${cfg.url}/rest/v1/api_food_cache`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([{ cache_key: cacheKey, source, query, payload: { items } }]),
    });
  } catch {
    /* mai bloquejar per la cache */
  }
}

export default async function handler(req: any, res: any) {
  const query = String(req.query?.query ?? req.query?.q ?? '').trim();
  const source = String(req.query?.source ?? 'all').toLowerCase();
  if (!query) return res.status(200).json({ items: [] });

  const cacheKey = `${source}:${query.toLowerCase()}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ items: cached, cached: true });

  const items: ProItem[] = [];
  try {
    if (source === 'usda' || source === 'all') {
      const key = process.env.USDA_API_KEY;
      if (key) {
        const url =
          `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}` +
          `&query=${encodeURIComponent(query)}&pageSize=8&dataType=${encodeURIComponent('Foundation,SR Legacy')}`;
        const r = await fetch(url);
        if (r.ok) {
          const d: any = await r.json();
          for (const f of d.foods ?? []) {
            const m = mapUsda(f);
            if (m) items.push(m);
          }
        }
      }
    }

    if (source === 'off' || source === 'all') {
      const url =
        'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=8' +
        `&search_terms=${encodeURIComponent(query)}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'Project75/1.0' } });
      if (r.ok) {
        const d: any = await r.json();
        for (const p of d.products ?? []) {
          const m = mapOff(p);
          if (m) items.push(m);
        }
      }
    }

    if (items.length) await cacheSet(cacheKey, source, query, items);
    return res.status(200).json({ items });
  } catch (e: any) {
    // Mai petar: el frontend usarà la base local.
    return res.status(200).json({ items: [], error: 'upstream', detail: String(e) });
  }
}
