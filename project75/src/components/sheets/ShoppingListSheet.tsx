import { SheetHeader } from '../Sheet';
import Icon from '../Icon';
import { SHOPPING_LIST } from '../../data/shopping';

export default function ShoppingListSheet() {
  return (
    <div>
      <SheetHeader title="Compra inicial Project75" sub="Base per volum. Podràs editar-la més endavant." />
      <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1">
        {SHOPPING_LIST.map((g) => (
          <div key={g.title} className="mt-3">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint mb-1.5">{g.title}</div>
            <div className="border border-line rounded-[14px] divide-y divide-line">
              {g.items.map((it) => (
                <div key={it} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[14px] font-medium">
                  <span className="w-4 h-4 rounded-[5px] border border-line2 grid place-items-center text-accent">
                    <Icon name="check" size={12} className="opacity-0" />
                  </span>
                  {it}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-faint mt-3 m-0">
        Marca-ho mentalment o al súper. La versió editable amb quantitats arriba amb la connexió a productes.
      </p>
    </div>
  );
}
