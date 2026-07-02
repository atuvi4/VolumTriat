/* Serverless (Vercel) — assistent d'idees d'àpats amb IA (estructurat).
   POST /api/ai-meal-suggest
   body: { slot, targetKcalApprox?, targetProteinApprox?, constraints?[], disliked?[], availableBaseFoods?[] }

   PRINCIPI: la IA NO és font de veritat nutricional. Proposa idees i ingredients
   aproximats; les kcal/proteïna reals es calcularan amb el Nutrition Engine.
   Per això aquí S'IGNOREN i s'eliminen kcal/macros que la IA pugui retornar.

   Sense OPENAI_API_KEY → 200 { available:false, suggestions:[] } (mai peta).
   Tipus "any" a propòsit per no dependre de @vercel/node. */

const SLOTS = ['esmorzar', 'dinar', 'berenar', 'sopar', 'snack'];

function normalizeSuggestions(raw: any, slot: string): any[] {
  const arr = Array.isArray(raw?.suggestions) ? raw.suggestions : Array.isArray(raw) ? raw : [];
  return arr.slice(0, 5).map((s: any, i: number) => ({
    id: `ai-${slot}-${Date.now()}-${i}`,
    name: String(s?.name ?? 'Idea').slice(0, 80),
    slot,
    // Només nom + grams aproximats. MAI kcal/macros de la IA.
    ingredients: (Array.isArray(s?.ingredients) ? s.ingredients : [])
      .slice(0, 8)
      .map((ing: any) => ({
        name: String(ing?.name ?? '').slice(0, 60),
        grams: Math.max(0, Math.round(Number(ing?.grams) || 0)),
      }))
      .filter((ing: any) => ing.name),
    reason: String(s?.reason ?? '').slice(0, 200),
    flags: {
      easy: !!s?.flags?.easy,
      noCook: !!s?.flags?.noCook,
      liquid: !!s?.flags?.liquid,
      highProtein: !!s?.flags?.highProtein,
    },
    source: 'ai_suggestion',
    confidence: 'low', // sempre baixa: és una proposta, no una mesura
  }));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ available: false, suggestions: [] });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(200).json({ available: false, suggestions: [], note: 'OPENAI_API_KEY absent' });

  const body = req.body ?? {};
  const slot = SLOTS.includes(body.slot) ? body.slot : 'dinar';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const sys =
    'Ets un assistent que proposa IDEES d\'àpats per a un objectiu de volum (pujar de pes amb qualitat). ' +
    'Respon NOMÉS amb JSON vàlid. NO inventis calories ni macros: un altre motor les calcularà. ' +
    'No incloguis camps de kcal, proteïna ni cap valor nutricional. ' +
    'Dona entre 3 i 5 idees realistes per a l\'àpat indicat, cada una amb ingredients i grams aproximats. ' +
    'Esquema: {"suggestions":[{"name":string,"ingredients":[{"name":string,"grams":number}],' +
    '"reason":string,"flags":{"easy":boolean,"noCook":boolean,"liquid":boolean,"highProtein":boolean}}]}';

  const user = {
    slot,
    targetKcalApprox: body.targetKcalApprox ?? null,
    targetProteinApprox: body.targetProteinApprox ?? null,
    constraints: Array.isArray(body.constraints) ? body.constraints.slice(0, 8) : [],
    disliked: Array.isArray(body.disliked) ? body.disliked.slice(0, 20) : [],
    availableBaseFoods: Array.isArray(body.availableBaseFoods) ? body.availableBaseFoods.slice(0, 40) : [],
  };

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: JSON.stringify(user) },
        ],
      }),
    });
    if (!r.ok) return res.status(200).json({ available: false, suggestions: [] });
    const data: any = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }
    return res.status(200).json({ available: true, suggestions: normalizeSuggestions(parsed, slot) });
  } catch (e: any) {
    // Mai petar en producció.
    return res.status(200).json({ available: false, suggestions: [], detail: String(e) });
  }
}
