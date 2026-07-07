import { useApp } from '../../hooks/useAppState';
import { SheetHeader, SheetOption } from '../Sheet';
import ManualEntrySheet from './ManualEntrySheet';
import PartialSheet from './PartialSheet';
import SwapSheet from './SwapSheet';
import MealPurchaseSheet from './MealPurchaseSheet';
import CorrectPurchaseSheet from './CorrectPurchaseSheet';
import type { ManualLog, ResolvedMeal } from '../../nutrition/nutritionTypes';

interface Props {
  meal: ResolvedMeal;
  /** Handlers embolcallats des de Nutrition (gestionen la confirmació d'ajustos). */
  onChange: (data: ManualLog) => void;
  onPartial: (pct: number) => void;
  onSkip: () => void;
}

/** Menú d'opcions d'un àpat planificat: adaptar-lo a la realitat sense sortir del pla. */
export default function MealActionsSheet({ meal, onChange, onPartial, onSkip }: Props) {
  const { openSheet, closeSheet, dislikeMeal, undoMeal } = useApp();
  // Àpats afegits (batut, extra, recepta): el seu id no comença per 'day-'.
  const isAdded = !meal.id.startsWith('day-');

  return (
    <div>
      <SheetHeader title={`Opcions · «${meal.slot}»`} sub={meal.name} />

      <SheetOption
        label="He menjat una altra cosa"
        meta="manual"
        onClick={() =>
          openSheet(
            <ManualEntrySheet
              title={`Àpat canviat · «${meal.slot}»`}
              sub="Anota el que has menjat en lloc d'aquest àpat."
              submitLabel="Desar canvi"
              closeOnSubmit={false}
              target={{ kcal: meal.nutrition.kcal, protein: meal.nutrition.protein }}
              allowPending
              onSubmit={onChange}
            />,
          )
        }
      />
      <SheetOption
        label="Només n'he menjat una part"
        meta="ració parcial"
        onClick={() => openSheet(<PartialSheet meal={meal} onSave={onPartial} />)}
      />
      <SheetOption label="Me l'he saltat" meta="no suma" onClick={onSkip} />

      <div className="my-2 border-t border-line" />

      <SheetOption
        label="Comprar per aquest àpat"
        meta="IA de compra"
        onClick={() => openSheet(<MealPurchaseSheet meal={meal} onChange={onChange} />)}
      />
      {meal.originNote?.includes('Compra IA') && (
        <SheetOption
          label="Corregir productes"
          meta="compra real"
          onClick={() => openSheet(<CorrectPurchaseSheet meal={meal} onChange={onChange} />)}
        />
      )}
      <SheetOption
        label="Canviar la recepta proposada"
        onClick={() => openSheet(<SwapSheet meal={meal} />)}
      />
      <SheetOption
        label="No em ve de gust"
        onClick={() => {
          dislikeMeal(meal.id);
          closeSheet();
        }}
      />

      {isAdded && (
        <>
          <div className="my-2 border-t border-line" />
          <SheetOption
            label="Treure aquest àpat"
            meta="afegit · s'elimina"
            onClick={() => {
              undoMeal(meal.id);
              closeSheet();
            }}
          />
        </>
      )}
    </div>
  );
}
