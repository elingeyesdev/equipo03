import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_W = 210; // mm — ancho estándar A4

/**
 * Captura el elemento por ID y lo exporta como PDF.
 *
 * Se genera una sola página con la altura exacta del contenido
 * (no se corta en páginas A4) para evitar que elementos queden
 * partidos en los saltos de página.
 *
 * Tailwind v4 usa oklch() en sus CSS variables; html2canvas no puede
 * parsear esa función. El callback onclone elimina todos los stylesheets
 * del documento clonado antes de capturar — seguro porque los reportes
 * usan exclusivamente inline styles.
 */
export async function exportElementToPdf(elementId: string, filename: string): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) throw new Error(`Element #${elementId} not found`);

  // Clona el elemento fuera del modal para evitar problemas con
  // position:fixed y overflow:hidden durante la captura.
  const clone = source.cloneNode(true) as HTMLElement;
  const host  = document.createElement('div');

  host.style.cssText = [
    'position:absolute',
    'left:0',
    `top:${document.documentElement.scrollHeight + 50}px`,
    `width:${source.scrollWidth}px`,
    'background:#ffffff',
    'z-index:-9999',
    'pointer-events:none',
  ].join(';');

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // Espera dos frames para que cualquier SVG/recharts termine de pintar
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      onclone: (clonedDocument) => {
        // Elimina stylesheets del clon para evitar el error de oklch()
        clonedDocument
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach(el => el.remove());
      },
    });

    const imgW = canvas.width;
    const imgH = canvas.height;

    // Convierte píxeles a mm manteniendo el ancho A4
    const mmPerPx     = A4_W / imgW;
    const contentH_mm = imgH * mmPerPx;

    // Una sola página con altura exacta al contenido:
    // evita cortar elementos a la mitad en saltos de página.
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_W, contentH_mm],
    });

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0, 0,
      A4_W, contentH_mm,
    );

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}
