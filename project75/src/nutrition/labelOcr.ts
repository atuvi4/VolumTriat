/* =========================================================
   Label OCR v1.1 — lectura LOCAL d'etiquetes amb Tesseract (open source).
   - Càrrega mandrosa (dynamic import): el bundle principal no creix;
     el lector (~5 MB, models cat+spa+eng) es baixa el PRIMER cop que
     s'usa i queda en memòria cau del navegador.
   - PREPROCESSAMENT: les fotos de mòbil en cru llegeixen malament.
     Abans de l'OCR: reescalat (~1800 px), escala de grisos i estirament
     de contrast (percentils 2-98). Això també converteix HEIC (iPhone)
     a PNG, que Tesseract no sabria obrir.
   - PSM 6 (bloc uniforme): el mode correcte per a taules nutricionals.
   - PRIVACITAT: tot es processa al dispositiu; la foto mai es puja.
   - MAI bloqueja l'app: qualsevol error → null (queda el camí manual).
   ========================================================= */

export interface OcrResult {
  text: string;
  /** Confiança mitjana de Tesseract (0-100). Orientativa: mai substitueix la revisió. */
  confidence: number;
}

export type OcrProgress = (pct: number, stage: 'download' | 'read') => void;

const MAX_DIM = 1800;

/** Reescala + grisos + contrast. Si res falla, retorna la imatge original. */
async function preprocess(image: File | Blob): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(image);
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return image;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const n = w * h;

    // Luminància + histograma per a l'estirament de contrast (percentils 2-98:
    // robust davant d'un píxel negre solt o un reflex blanc).
    const lum = new Uint8Array(n);
    const hist = new Uint32Array(256);
    for (let i = 0, p = 0; p < n; i += 4, p++) {
      const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
      lum[p] = l;
      hist[l]++;
    }
    const clip = n * 0.02;
    let lo = 0;
    let acc = 0;
    while (lo < 255 && acc + hist[lo] < clip) acc += hist[lo++];
    let hi = 255;
    acc = 0;
    while (hi > 0 && acc + hist[hi] < clip) acc += hist[hi--];
    const range = Math.max(1, hi - lo);

    for (let i = 0, p = 0; p < n; i += 4, p++) {
      const v = Math.max(0, Math.min(255, Math.round(((lum[p] - lo) * 255) / range)));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ?? image;
  } catch {
    return image;
  }
}

/** Llegeix el text d'una imatge d'etiqueta. null si l'OCR no està disponible o falla. */
export async function ocrLabelImage(image: File | Blob, onProgress?: OcrProgress): Promise<OcrResult | null> {
  try {
    const prepared = await preprocess(image);
    const { createWorker, PSM } = await import('tesseract.js');
    const worker = await createWorker(['cat', 'spa', 'eng'], 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (!onProgress || typeof m.progress !== 'number') return;
        if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100), 'read');
        else onProgress(Math.round(m.progress * 100), 'download');
      },
    });
    try {
      // PSM 6: tracta la imatge com un bloc uniforme de text (taula nutricional).
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const { data } = await worker.recognize(prepared);
      const text = (data.text ?? '').trim();
      if (!text) return null;
      return { text, confidence: Math.round(data.confidence ?? 0) };
    } finally {
      await worker.terminate();
    }
  } catch {
    return null; // sense xarxa el primer cop, navegador antic, error del worker…
  }
}
