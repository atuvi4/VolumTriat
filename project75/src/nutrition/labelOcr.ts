/* =========================================================
   Label OCR v1 — lectura LOCAL d'etiquetes amb Tesseract (open source).
   - Càrrega mandrosa (dynamic import): el bundle principal no creix;
     el lector (~5 MB, models cat+spa+eng) es baixa el PRIMER cop que
     s'usa i queda en memòria cau del navegador.
   - PRIVACITAT: la imatge es processa al dispositiu (WASM al navegador);
     només es descarrega el codi/models, mai es puja la foto.
   - MAI bloqueja l'app: qualsevol error → null (la UI ofereix el camí
     manual). La confiança de l'OCR sempre es tracta com a baixa: els
     números els confirma l'usuari.
   ========================================================= */

export interface OcrResult {
  text: string;
  /** Confiança mitjana de Tesseract (0-100). Orientativa: mai substitueix la revisió. */
  confidence: number;
}

export type OcrProgress = (pct: number, stage: 'download' | 'read') => void;

/** Llegeix el text d'una imatge d'etiqueta. null si l'OCR no està disponible o falla. */
export async function ocrLabelImage(image: File | Blob, onProgress?: OcrProgress): Promise<OcrResult | null> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['cat', 'spa', 'eng'], 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (!onProgress || typeof m.progress !== 'number') return;
        if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100), 'read');
        else onProgress(Math.round(m.progress * 100), 'download');
      },
    });
    try {
      const { data } = await worker.recognize(image);
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
