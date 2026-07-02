import { useState } from 'react';
import Card from './Card';
import Icon from './Icon';
import { searchFoodPro, type ProFoodItem } from '../nutrition/apiAdapters/foodProAdapter';

/** Backend Nutrition Pro v1 — cerca experimental d'aliments (USDA + Open Food Facts).
 *  Només verifica que el backend + APIs funcionen. No desa res ni toca el menú. */
export default function FoodSearchProCard() {
  const [q, setQ] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'results' | 'empty'>('idle');
  const [items, setItems] = useState<ProFoodItem[]>([]);

  const run = async () => {
    if (!q.trim()) return;
    setState('loading');
    const res = await searchFoodPro(q, 'all');
    setItems(res);
    setState(res.length > 0 ? 'results' : 'empty');
  };

  const confColor = (c: ProFoodItem['confidence']) =>
    c === 'high' ? 'text-accent bg-accent-soft' : c === 'medium' ? 'text-info bg-info-soft' : 'text-muted bg-surface2';

  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Nutrition Pro (experimental)</div>
      <Card>
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 font-bold text-[13.5px] text-accent-strong">
            <Icon name="database" size={16} /> Cercar aliment PRO
            <Icon name="chev" size={14} className="ml-auto text-muted" />
          </summary>

          <div className="mt-3 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') run();
              }}
              placeholder="Ex: arròs, iogurt grec, tonyina…"
              className="flex-1 bg-surface2 border border-line2 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
            />
            <button
              onClick={run}
              disabled={state === 'loading' || !q.trim()}
              className="inline-flex items-center gap-1.5 bg-accent text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:bg-accent-strong disabled:opacity-55"
            >
              <Icon name="database" size={15} /> {state === 'loading' ? 'Cercant…' : 'Cercar'}
            </button>
          </div>

          {state === 'results' && (
            <div className="mt-3 flex flex-col gap-2">
              {items.map((it) => (
                <div key={it.externalId} className="border border-line rounded-[14px] p-3 bg-surface2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[14px] truncate">{it.name}</div>
                      {it.brand && <div className="text-[12px] text-faint">{it.brand}</div>}
                    </div>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${confColor(it.confidence)}`}>
                      {it.confidence}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-muted mt-1">
                    {Math.round(it.kcalPer100g)} kcal · {Math.round(it.proteinPer100g)} g P · {Math.round(it.carbsPer100g)} C ·{' '}
                    {Math.round(it.fatPer100g)} G <span className="text-faint font-medium">/ 100 g</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-faint">
                    <Icon name="info" size={12} /> Font: {it.source}
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-faint mt-1 mb-0">
                Dades reals (USDA / Open Food Facts). Encara no es desa ni substitueix el menú.
              </p>
            </div>
          )}

          {state === 'empty' && (
            <p className="text-[13px] text-muted mt-3 mb-0">
              Sense resultats ara mateix (potser falten claus al backend o l'API no respon). L'app segueix funcionant amb la
              base local.
            </p>
          )}

          <p className="text-[12px] text-faint mt-3 mb-0">
            Les calories/macros venen de fonts nutricionals, mai d'una IA. Les claus viuen al servidor.
          </p>
        </details>
      </Card>
    </div>
  );
}
