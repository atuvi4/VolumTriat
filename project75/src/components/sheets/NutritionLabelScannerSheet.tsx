import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../hooks/useAppState';
import { SheetHeader } from '../Sheet';
import Button from '../Button';
import Icon from '../Icon';
import { parseNutritionLabelText, validateParsedLabel, type ParsedNutritionLabel } from '../../nutrition/nutritionLabelParser';
import { ocrLabelImage } from '../../nutrition/labelOcr';

/* =========================================================
   Nutrition Label Scanner v1 — foto de l'etiqueta + lectura assistida.
   V1 SENSE OCR automàtic (seria una dependència de ~15 MB): fas la foto,
   la veus al costat del formulari i omples/enganxes el text (Live Text /
   Lens del mòbil llegeix la foto per tu). El parser entén CA/ES/EN.
   PRIVACITAT: la foto no surt del dispositiu ni es guarda enlloc.
   CONFIANÇA: res es registra sense revisió manual; l'etiqueta confirmada
   per tu és la dada més fiable de l'app.
   ========================================================= */

interface Props {
  mode?: 'product' | 'manual-entry' | 'supplement';
  initialName?: string;
}

type Basis = 'per100g' | 'per100ml' | 'perServing';

const inputCls =
  'w-full bg-surface2 border border-line2 rounded-xl px-4 py-3 text-[15px] font-semibold focus:outline-none focus:border-accent';
const numCls = `${inputCls} text-right`;

const n = (s: string): number | undefined => {
  if (s.trim() === '') return undefined;
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? v : undefined;
};

export default function NutritionLabelScannerSheet({ initialName }: Props) {
  const { state, isReadOnly, addExtra, saveProductFromLabel, removeSavedProduct, closeSheet } = useApp();

  // ---------- Foto (només local: object URL, mai guardada) ----------
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrPct, setOcrPct] = useState(0);
  const [ocrStage, setOcrStage] = useState<'download' | 'read'>('download');
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    e.target.value = '';
    void runOcr(f); // lectura automàtica en fer la foto
  };
  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  /** OCR local (Tesseract, lazy). Mai bloqueja: si falla, queda el camí manual. */
  const runOcr = async (f: File) => {
    setOcrBusy(true);
    setOcrPct(0);
    setReadNote(null);
    const res = await ocrLabelImage(f, (pct, stage) => {
      setOcrPct(pct);
      setOcrStage(stage);
    });
    setOcrBusy(false);
    if (!res || !res.text.trim()) {
      setReadNote('No he pogut llegir la foto. Prova una foto més recta i a prop del quadre nutricional, o enganxa/escriu els valors a mà.');
      return;
    }
    setPasted(res.text); // el text llegit queda visible i corregible
    setShowPaste(true); // transparència: mostra què ha entès l'OCR
    applyParsedText(res.text, res.confidence);
  };

  // ---------- Camps editables (la revisió manual és obligatòria) ----------
  const [name, setName] = useState(initialName ?? '');
  const [basis, setBasis] = useState<Basis>('per100g');
  const [servingG, setServingG] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [grams, setGrams] = useState('100');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [readNote, setReadNote] = useState<string | null>(null);

  // ---------- Lectura de text (OCR, Live Text / Lens, o teclejat) ----------
  const [showPaste, setShowPaste] = useState(false);
  const [pasted, setPasted] = useState('');

  /** Omple el formulari des d'un text d'etiqueta. Mai sobreescriu amb buits. */
  const applyParsedText = (text: string, ocrConfidence?: number) => {
    const p = parseNutritionLabelText(text);
    if (p.kcal != null) setKcal(String(p.kcal));
    if (p.protein != null) setProtein(String(p.protein));
    if (p.carbs != null) setCarbs(String(p.carbs));
    if (p.fat != null) setFat(String(p.fat));
    if (p.servingGrams != null) {
      setServingG(String(p.servingGrams));
      setGrams(String(p.servingGrams));
    }
    if (p.basis !== 'unknown') setBasis(p.basis);
    const ws = [...p.warnings];
    if (ocrConfidence != null && ocrConfidence < 60) {
      ws.push('La lectura de la foto ha sortit poc nítida: repassa cada número amb l\'etiqueta.');
    }
    setWarnings(ws);
    const found = [p.kcal, p.protein, p.carbs, p.fat].filter((v) => v != null).length;
    setReadNote(
      found === 0
        ? 'No ho puc llegir bé: introdueix els valors a mà mirant la foto.'
        : `He llegit ${found} valor${found > 1 ? 's' : ''} de l'etiqueta · confiança ${p.confidence === 'medium' && (ocrConfidence == null || ocrConfidence >= 60) ? 'mitjana' : 'baixa'}. Confirma'ls abans de guardar.`,
    );
  };

  const readText = () => applyParsedText(pasted);

  // ---------- Validació en viu (mai desar números impossibles) ----------
  const kcalN = n(kcal);
  const protN = n(protein);
  const gramsN = n(grams);
  const servingN = n(servingG);

  const liveParsed: ParsedNutritionLabel = {
    basis, servingGrams: servingN, kcal: kcalN, protein: protN, carbs: n(carbs), fat: n(fat),
    warnings: [], confidence: 'low',
  };
  const liveWarnings = validateParsedLabel(liveParsed);
  const allWarnings = [...new Set([...warnings, ...liveWarnings])];

  const baseValid = kcalN != null && kcalN > 0 && protN != null && protN >= 0;

  /** Per registrar: factor segons base i grams consumits (o racions). */
  const perServingNoGrams = basis === 'perServing' && servingN == null;
  const factor = perServingNoGrams
    ? (gramsN ?? 1) // en aquest cas «grams» són RACIONS
    : basis === 'perServing'
      ? (gramsN ?? 0) / (servingN as number) // racions derivades de grams? no: grams / serving → per valors de ració
      : (gramsN ?? 0) / 100;

  const regKcal = baseValid && gramsN ? Math.round((kcalN as number) * factor) : null;
  const regProt = baseValid && gramsN ? Math.round((protN as number) * factor) : null;
  const canRegister = baseValid && gramsN != null && gramsN > 0 && regKcal != null && regKcal > 0 && regKcal <= 3000;

  /** Per guardar producte cal per-100: directe, o derivat de ració amb grams. */
  const per100 =
    basis !== 'perServing'
      ? baseValid ? { kcal: kcalN as number, protein: protN as number, carbs: n(carbs), fat: n(fat) } : null
      : baseValid && servingN
        ? {
            kcal: ((kcalN as number) / servingN) * 100,
            protein: ((protN as number) / servingN) * 100,
            carbs: n(carbs) != null ? ((n(carbs) as number) / servingN) * 100 : undefined,
            fat: n(fat) != null ? ((n(fat) as number) / servingN) * 100 : undefined,
          }
        : null;
  const canSave = per100 != null && name.trim().length >= 2;

  const registerNow = () => {
    if (!canRegister) return;
    const desc = perServingNoGrams ? `${gramsN} ració${(gramsN ?? 0) > 1 ? 'ns' : ''}` : `${Math.round(gramsN as number)} g`;
    addExtra({
      name: `${name.trim() || 'Producte'} (${desc})`,
      kcal: regKcal as number,
      protein: regProt as number,
      note: `Etiqueta revisada per tu · ${desc}`,
    });
    closeSheet();
  };

  const saveProduct = () => {
    if (!canSave || !per100) return;
    saveProductFromLabel({
      name: name.trim(),
      kcalPer100g: per100.kcal,
      proteinPer100g: per100.protein,
      carbsPer100g: per100.carbs,
      fatPer100g: per100.fat,
      servingGrams: servingN,
    });
  };

  const loadSaved = (id: string) => {
    const p = (state.savedProducts ?? []).find((x) => x.id === id);
    if (!p) return;
    setName(p.name);
    setBasis('per100g');
    setKcal(String(p.per100g.kcal));
    setProtein(String(p.per100g.protein));
    setCarbs(p.per100g.carbs != null ? String(p.per100g.carbs) : '');
    setFat(p.per100g.fat != null ? String(p.per100g.fat) : '');
    setServingG(p.servingGrams != null ? String(p.servingGrams) : '');
    setGrams(String(p.servingGrams ?? 100));
    setWarnings([]);
    setReadNote('Producte guardat (etiqueta revisada per tu). Posa els grams i registra\'l.');
  };

  const saved = state.savedProducts ?? [];

  return (
    <div>
      <SheetHeader title="Escanejar etiqueta" sub="Foto del quadre nutricional · revisa i confirma abans de guardar" />

      {isReadOnly && (
        <div className="mt-2 flex items-center gap-2 bg-info-soft text-info rounded-[10px] px-3 py-2 text-[12.5px] font-semibold">
          <Icon name="info" size={15} /> Mode visita: no es poden guardar productes ni registrar.
        </div>
      )}

      {/* Productes ja guardats: un toc per carregar-los */}
      {saved.length > 0 && (
        <div className="mt-3">
          <div className="text-[12px] font-semibold text-muted mb-1.5">Els teus productes (etiqueta confirmada)</div>
          <div className="flex flex-wrap gap-1.5">
            {saved.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 bg-accent-soft border border-accent-line rounded-full pl-3 pr-1.5 py-1">
                <button onClick={() => loadSaved(p.id)} className="text-[12.5px] font-semibold text-accent-strong">
                  {p.name} <span className="font-medium opacity-70">· {p.per100g.kcal} kcal/100g</span>
                </button>
                <button onClick={() => removeSavedProduct(p.id)} aria-label={`Eliminar ${p.name}`} className="text-accent-strong/60 hover:text-danger p-0.5">
                  <Icon name="x" size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Foto local */}
      <div className="mt-3">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt="Etiqueta nutricional" className="w-full max-h-[38vh] object-contain bg-ink/90 rounded-[14px]" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 text-[12px] font-bold text-white bg-ink/70 rounded-full px-3 py-1.5"
            >
              Tornar a fer la foto
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-1.5 border-2 border-dashed border-line2 rounded-[14px] py-6 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Icon name="image" size={26} />
            <span className="text-[13.5px] font-semibold">Fer foto de l'etiqueta</span>
            <span className="text-[11.5px] text-faint">o triar-la de la galeria</span>
          </button>
        )}
        {ocrBusy && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[12px] font-semibold text-muted mb-1">
              <span>{ocrStage === 'download' ? 'Preparant el lector (només el primer cop, ~5 MB)…' : 'Llegint l\'etiqueta…'}</span>
              <span className="tnum">{ocrPct}%</span>
            </div>
            <div className="h-1.5 bg-track rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-[width] duration-300" style={{ width: `${ocrPct}%` }} />
            </div>
          </div>
        )}
        <p className="text-[11px] text-faint mt-1.5 mb-0">
          La foto es llegeix i es processa <b>en aquest dispositiu</b>. No es puja ni es guarda enlloc.
        </p>
      </div>

      {/* Lectura de text (Live Text / Lens) */}
      {!showPaste ? (
        <button onClick={() => setShowPaste(true)} className="mt-2.5 text-[12.5px] font-semibold text-accent">
          + Enganxa el text de l'etiqueta (el llegeixo jo)
        </button>
      ) : (
        <div className="mt-2.5 border border-line rounded-[12px] p-3">
          <div className="text-[12px] font-semibold text-muted mb-1.5">
            Al mòbil pots seleccionar el text de la foto (mantén premut) i enganxar-lo aquí:
          </div>
          <textarea
            className={`${inputCls} min-h-[84px] font-medium text-[13px]`}
            placeholder={'Valor energètic 1520 kJ / 363 kcal\nGreixos 6,5 g\nHidrats de carboni 58 g\nProteïnes 13 g'}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button variant="primary" size="sm" icon="database" disabled={!pasted.trim()} onClick={readText}>
              Llegir el text
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPaste(false)}>Amagar</Button>
          </div>
        </div>
      )}

      {readNote && (
        <div className="mt-2.5 flex items-start gap-2 text-[12px] font-semibold text-info bg-info-soft border border-info-line/60 rounded-[10px] px-3 py-2">
          <Icon name="info" size={14} className="shrink-0 mt-0.5" /> {readNote}
        </div>
      )}

      {/* Formulari revisable — la font de veritat ets tu */}
      <label className="block mt-3 text-[12.5px] font-semibold text-muted">Nom del producte</label>
      <input className={`${inputCls} mt-1`} placeholder="Ex: Iogurt proteïnes natural" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="mt-3">
        <span className="block text-[12.5px] font-semibold text-muted mb-1">Base de l'etiqueta</span>
        <div className="inline-flex bg-seg rounded-[10px] p-[3px]">
          {([['per100g', 'per 100 g'], ['per100ml', 'per 100 ml'], ['perServing', 'per ració']] as [Basis, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setBasis(v)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold ${basis === v ? 'bg-white shadow-card' : 'text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Kcal *</label>
          <input className={`${numCls} mt-1`} type="text" inputMode="decimal" placeholder="—" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Proteïna (g) *</label>
          <input className={`${numCls} mt-1`} type="text" inputMode="decimal" placeholder="—" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Hidrats (g)</label>
          <input className={`${numCls} mt-1`} type="text" inputMode="decimal" placeholder="—" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-muted">Greixos (g)</label>
          <input className={`${numCls} mt-1`} type="text" inputMode="decimal" placeholder="—" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
      </div>

      <label className="block mt-3 text-[12.5px] font-semibold text-muted">
        Ració (g/ml) <span className="text-faint font-medium">(si l'etiqueta la diu)</span>
      </label>
      <input className={`${numCls} mt-1 !w-[140px]`} type="text" inputMode="decimal" placeholder="—" value={servingG} onChange={(e) => setServingG(e.target.value)} />

      {allWarnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 text-[12px] font-semibold text-warn bg-warn-soft border border-warn-line/60 rounded-[10px] px-3 py-2">
          <Icon name="alert" size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="mb-0.5">Revisa l'etiqueta: lectura amb baixa confiança.</div>
            {allWarnings.map((w) => (
              <div key={w} className="font-medium">· {w}</div>
            ))}
          </div>
        </div>
      )}

      {/* Registrar ara: grams consumits → kcal calculades */}
      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[12.5px] font-semibold text-muted">
              {perServingNoGrams ? 'Racions consumides' : 'Grams consumits'}
            </label>
            <input className={`${numCls} mt-1 !w-[120px]`} type="text" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} />
          </div>
          {canRegister && (
            <div className="pb-1 text-[13px] font-bold tnum">
              = {regKcal} kcal · {regProt} g proteïna
            </div>
          )}
        </div>
        {perServingNoGrams && (
          <p className="text-[11.5px] text-faint mt-1 mb-0">
            Sense grams de ració no puc passar-ho a per-100 g: registro racions senceres i no es pot desar com a producte.
          </p>
        )}
      </div>

      {!baseValid && (
        <p className="text-[12px] font-semibold text-warn mt-3 mb-0">
          Per registrar falten les kcal i la proteïna (marcades amb *): omple-les mirant la foto si la lectura no les ha trobat.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="primary" icon="check" className="flex-1" disabled={!canRegister || isReadOnly} onClick={registerNow}>
          Registrar ara
        </Button>
        <Button variant="ghost" icon="database" disabled={!canSave || isReadOnly} onClick={saveProduct}>
          Guardar aliment
        </Button>
        <Button variant="ghost" onClick={closeSheet}>Cancel·lar</Button>
      </div>
      {!canSave && basis === 'perServing' && baseValid && (
        <p className="text-[11.5px] text-faint mt-1.5 mb-0">Per guardar-lo com a producte cal la ració en grams (per derivar el per-100 g).</p>
      )}
      <p className="text-[11px] text-faint mt-2 mb-0">
        En registrar quedarà com a «Etiqueta revisada per tu»: la dada més fiable de l'app, per sobre de qualsevol estimació.
      </p>
    </div>
  );
}
