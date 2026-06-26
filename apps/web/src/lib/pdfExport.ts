import html2canvas from 'html2canvas';

/**
 * Captura un elemento del DOM como PNG base64.
 * Usado para incrustar gráficas (elementos pequeños ~400×250px)
 * en el PDF generado por @react-pdf/renderer.
 * Elimina stylesheets antes de capturar para evitar que oklch() de Tailwind v4
 * rompa el parser de html2canvas.
 */
export async function captureElementAsPng(elementId: string): Promise<string> {
  const el = document.getElementById(elementId);
  if (!el) return '';
  const canvas = await html2canvas(el, {
    scale: 1.5,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
    onclone: (doc) =>
      doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(e => e.remove()),
  });
  return canvas.toDataURL('image/png');
}
