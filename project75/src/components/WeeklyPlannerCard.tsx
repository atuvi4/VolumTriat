import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Button from './Button';
import Icon from './Icon';
import type { MealSlot } from '../nutrition/nutritionTypes';
import { shoppingListFromWeeklyMenu, weeklyPrepSuggestions, batchCookingNotes } from '../nutrition/mealPrep';
import { shortDate } from '../utils/date';

const WEEKDAY = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
const SLOT_LABEL: Record<MealSlot, string> = {
  esmorzar: 'Esmorzar', dinar: 'Dinar', berenar: 'Berenar', sopar: 'Sopar', snack: 'Snack',
};

type Panel = 'week' | 'shop' | 'prep';

function Disclaimer() {
  return (
    <p className="text-[11.5px] text-faint leading-relaxed m-0">
      Menú orientatiu: ajusta’l segons gana, disponibilitat i etiqueta real. Project75 prioritza consistència i volum;
      no substitueix un nutricionista clínic.
    </p>
  );
}

export default function WeeklyPlannerCard() {
  const { state, generateWeek, regenerateWeekDay, isReadOnly } = useApp();
  const plan = state.weeklyPlan;
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('week');
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 pb-2"
      >
        <span className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint flex items-center gap-1.5">
          <Icon name="calendar" size={14} /> Setmana
        </span>
        <Icon name="chev" size={16} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <Card className="py-4 space-y-3">
          {!plan ? (
            <>
              <p className="text-[13px] text-muted m-0">
                Planifica el menú de tota la setmana per comprar i cuinar amb temps: més varietat, menys repeticions.
              </p>
              <Button variant="primary" size="sm" icon="calendar" disabled={isReadOnly} onClick={generateWeek}>
                Generar menú de la setmana
              </Button>
              <Disclaimer />
            </>
          ) : (
            <>
              {/* Pestanyes */}
              <div className="flex flex-wrap gap-2">
                <Button variant={panel === 'week' ? 'primary' : 'ghost'} size="sm" icon="calendar" onClick={() => setPanel('week')}>
                  Setmana
                </Button>
                <Button variant={panel === 'shop' ? 'primary' : 'ghost'} size="sm" icon="store" onClick={() => setPanel('shop')}>
                  Llista compra
                </Button>
                <Button variant={panel === 'prep' ? 'primary' : 'ghost'} size="sm" icon="info" onClick={() => setPanel('prep')}>
                  Preparació
                </Button>
              </div>

              {panel === 'week' && (
                <div className="space-y-2">
                  {plan.days.map((day) => {
                    const isOpen = openDay === day.date;
                    return (
                      <div key={day.date} className="border border-line rounded-[12px] overflow-hidden">
                        <button
                          onClick={() => setOpenDay(isOpen ? null : day.date)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface2"
                        >
                          <div className="text-left">
                            <div className="text-[13.5px] font-bold">
                              {WEEKDAY[day.weekday]} <span className="text-faint font-semibold">{shortDate(day.date)}</span>
                            </div>
                            <div className="text-[11.5px] text-muted">{day.kcal} kcal · {day.protein} g proteïna</div>
                          </div>
                          <Icon name="chev" size={15} className={`text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-line">
                            {day.meals.map((m) => (
                              <div key={m.slot} className="flex items-center justify-between px-3.5 py-2">
                                <div>
                                  <div className="text-[11px] text-faint font-semibold uppercase tracking-wide">{SLOT_LABEL[m.slot]}</div>
                                  <div className="text-[13.5px] font-semibold">{m.name}</div>
                                </div>
                                <div className="text-right text-[12px] text-muted font-semibold">
                                  {m.kcal} kcal<div className="text-[11px] text-faint">{m.protein} g P</div>
                                </div>
                              </div>
                            ))}
                            <div className="px-3.5 py-2">
                              <Button variant="ghost" size="sm" icon="swap" disabled={isReadOnly} onClick={() => regenerateWeekDay(day.date)}>
                                Regenerar dia
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-1">
                    <Button variant="ghost" size="sm" icon="swap" disabled={isReadOnly} onClick={generateWeek}>
                      Regenerar setmana
                    </Button>
                  </div>
                  <Disclaimer />
                </div>
              )}

              {panel === 'shop' && (
                <div className="space-y-3">
                  {shoppingListFromWeeklyMenu(plan).map((g) => (
                    <div key={g.key}>
                      <div className="text-[12px] font-bold text-muted mb-1">{g.label}</div>
                      <div className="border border-line rounded-[12px] divide-y divide-line">
                        {g.items.map((it) => (
                          <div key={it.foodId} className="flex items-center justify-between px-3.5 py-2 text-[13.5px]">
                            <span className="font-semibold">{it.name}</span>
                            <span className="text-muted font-semibold">{it.approx}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[11.5px] text-faint m-0">Quantitats aproximades (V1) sumant les receptes de la setmana.</p>
                </div>
              )}

              {panel === 'prep' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[12px] font-bold text-muted mb-1">Preparació setmanal</div>
                    <ul className="m-0 pl-4 space-y-1.5 text-[13px]">
                      {weeklyPrepSuggestions(plan).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-line pt-3">
                    <div className="text-[12px] font-bold text-muted mb-1">Batch cooking</div>
                    <ul className="m-0 pl-4 space-y-1.5 text-[13px]">
                      {batchCookingNotes(plan).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <Disclaimer />
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
