import { useApp } from '../hooks/useAppState';
import Card from './Card';
import Button from './Button';
import Icon from './Icon';
import ManualEntrySheet from './sheets/ManualEntrySheet';
import { todayISO } from '../utils/date';

/** Suplements v1 — creatina (hàbit, 0 kcal) i Anabolic Master (proteïna amb aigua).
 *  A part dels batuts de menjar. Cap macro inventada: l'Anabolic Master usa les
 *  dades de l'etiqueta que introdueixes tu (es recorden per registrar-lo amb un toc). */
export default function SupplementsCard() {
  const { state, isReadOnly, addExtra, toggleCreatine, saveAnabolicServing, openSheet } = useApp();
  const sup = state.supplements ?? { creatineDates: [] };
  const creatineToday = sup.creatineDates.includes(todayISO());
  const serv = sup.anabolicServing;

  const configAnabolic = () =>
    openSheet(
      <ManualEntrySheet
        title="Anabolic Master · dades de l'etiqueta"
        sub="Posa el que digui l'etiqueta per cassó: calories i proteïna. Ho recordaré per registrar-ho amb un toc."
        submitLabel="Desar dades"
        initial={serv ? { name: 'Anabolic Master', kcal: serv.kcal, protein: serv.protein } : undefined}
        onSubmit={(d) => saveAnabolicServing(d.kcal, d.protein)}
      />,
    );

  const logAnabolic = () => {
    if (!serv) return;
    addExtra({
      name: 'Anabolic Master (amb aigua)',
      kcal: serv.kcal,
      protein: serv.protein,
      note: 'Suplement · proteïna amb aigua (etiqueta)',
    });
  };

  return (
    <Card title="Suplements" className="mt-3.5">
      <p className="text-[12.5px] text-muted mt-0 mb-2">
        A part dels batuts de menjar. La creatina no suma calories; l'Anabolic Master suma proteïna i kcal segons la teva etiqueta.
      </p>

      {/* Creatina */}
      <div className="flex items-center justify-between gap-3 py-2.5 border-t border-line">
        <div>
          <div className="font-semibold text-[14.5px]">Creatina</div>
          <div className="text-[12px] text-faint">Hàbit diari · 0 kcal</div>
        </div>
        <Button
          variant={creatineToday ? 'primary' : 'ghost'}
          size="sm"
          icon={creatineToday ? 'checkCircle' : 'check'}
          disabled={isReadOnly}
          onClick={toggleCreatine}
        >
          {creatineToday ? 'Feta avui' : 'Marcar feta'}
        </Button>
      </div>

      {/* Anabolic Master */}
      <div className="flex items-center justify-between gap-3 py-2.5 border-t border-line">
        <div>
          <div className="font-semibold text-[14.5px]">Anabolic Master</div>
          <div className="text-[12px] text-faint">
            {serv
              ? `≈ ${serv.kcal} kcal · ${serv.protein} g proteïna / cassó (etiqueta)`
              : "Amb aigua · falten les dades de l'etiqueta"}
          </div>
        </div>
        {serv ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="primary" size="sm" icon="cup" disabled={isReadOnly} onClick={logAnabolic}>
              Registrar
            </Button>
            <button
              onClick={configAnabolic}
              disabled={isReadOnly}
              aria-label="Editar dades"
              className="text-muted hover:text-ink p-1 disabled:opacity-50"
            >
              <Icon name="edit" size={15} />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" icon="plus" disabled={isReadOnly} onClick={configAnabolic}>
            Afegir dades
          </Button>
        )}
      </div>
    </Card>
  );
}
