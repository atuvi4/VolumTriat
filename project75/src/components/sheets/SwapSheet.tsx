import { useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import Icon from '../Icon';
import { swapOptionsFor } from '../../nutrition/mealPlans';
import { rankSwapOptions } from '../../brain/brain';
import { previewNutrition } from '../../nutrition/mealBuilder';
import { suggestMealsAI, type AiMealSuggestion } from '../../nutrition/apiAdapters/aiMealAdapter';
import type { MealSlot, ResolvedMeal } from '../../nutrition/nutritionTypes';

const SLOT_PREP: Record<MealSlot, string> = {
  esmorzar: "d'esmorzar",
  dinar: 'de dinar',
  berenar: 'de berenar',
  sopar: 'de sopar',
  snack: 'de snack',
};

const INITIAL = 5;

// Flag experimental (Nutrition Pro v1). Off per defecte → V1 UI intacta.
const PRO_ENABLED =
  (import.meta.env as Record<string, string | undefined>).VITE_NUTRITION_PRO === '1';

/** Substitueix la recepta proposada del pla per una altra equivalent del mateix
 *  àpat (abans de menjar). No registra res menjat: això ho fa "Canviat". */
export default function SwapSheet({ meal }: { meal: ResolvedMeal }) {
  const { state, swapMeal, closeSheet } = useApp();
  const [showAll, setShowAll] = useState(false);

  // Estat de l'assistent IA (opcions PRO).
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done' | 'unavailable'>('idle');
  const [aiSuggestions, setAiSuggestions] = useState<AiMealSuggestion[]>([]);

  // Base per slot (evita dislikes) + priorització apresa (Brain v1).
  const all = rankSwapOptions(swapOptionsFor(meal, state.dislikes), state.outcomes ?? []);
  const shown = showAll ? all : all.slice(0, INITIAL);

  const runPro = async () => {
    setAiState('loading');
    const constraints: string[] = [];
    if (state.dayMode === 'pocaGana') constraints.push('poca gana');
    if (state.dayMode === 'dificil') constraints.push('dia difícil');
    const r = await suggestMealsAI({
      slot: meal.slot,
      targetKcalApprox: meal.nutrition.kcal,
      targetProteinApprox: meal.nutrition.protein,
      constraints,
      disliked: state.dislikes,
    });
    setAiSuggestions(r.suggestions);
    setAiState(r.available && r.suggestions.length > 0 ? 'done' : 'unavailable');
  };

  return (
    <div>
      <SheetHeader
        title={`Canviar «${meal.slot}»`}
        sub={`Opcions ${SLOT_PREP[meal.slot]} equivalents, evitant el que et cansa`}
      />

      {shown.length === 0 && (
        <p className="text-[13.5px] text-muted mt-2 mb-0">
          Ara mateix no hi ha més alternatives per aquest àpat.
        </p>
      )}

      {shown.map((r) => {
        const n = previewNutrition(r);
        return (
          <SheetOption
            key={r.id}
            label={r.name}
            meta={`${n.kcal} kcal · ${n.protein}g`}
            onClick={() => {
              swapMeal(meal.id, r);
              closeSheet();
            }}
          />
        );
      })}

      {!showAll && all.length > INITIAL && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center mt-2.5 text-[13px] font-semibold text-accent py-2"
        >
          Veure més opcions ({all.length - INITIAL})
        </button>
      )}

      {/* Nutrition Pro v1 — assistent IA (experimental, darrere flag) */}
      {PRO_ENABLED && (
        <div className="mt-3 pt-3 border-t border-line">
          {aiState !== 'done' && (
            <button
              onClick={runPro}
              disabled={aiState === 'loading'}
              className="w-full inline-flex items-center justify-center gap-2 bg-info-soft text-info font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] disabled:opacity-60"
            >
              <Icon name="coach" size={16} />
              {aiState === 'loading' ? 'Generant…' : 'Generar opcions PRO'}
            </button>
          )}

          {aiState === 'unavailable' && (
            <p className="text-[12.5px] text-muted mt-2 mb-0">
              L'assistent PRO no està disponible ara mateix. Segueix amb les opcions de la base local.
            </p>
          )}

          {aiState === 'done' && (
            <div className="mt-1">
              <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-info mb-1.5">
                <Icon name="info" size={13} /> Proposta IA · pendent de càlcul/verificació
              </div>
              {aiSuggestions.map((s) => (
                <div key={s.id} className="border border-line rounded-[14px] p-3 mt-2 bg-surface2">
                  <div className="font-bold text-[14px]">{s.name}</div>
                  <div className="text-[12.5px] text-muted mt-0.5">
                    {s.ingredients.map((i) => `${i.name} ${i.grams}g`).join(' · ')}
                  </div>
                  {s.reason && <div className="text-[12px] text-faint mt-1">{s.reason}</div>}
                  <div className="text-[11px] text-faint font-semibold mt-1.5">
                    Font: proposta IA · sense kcal verificades
                  </div>
                </div>
              ))}
              <p className="text-[11.5px] text-faint mt-2 mb-0">
                Les idees IA no tenen calories fiables: es calcularan amb el motor nutricional en una versió futura.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
