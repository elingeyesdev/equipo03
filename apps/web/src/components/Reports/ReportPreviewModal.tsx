import React, { useState, useRef } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportElementToPdf } from '../../lib/pdfExport';
import type { ReportFilters } from './types';
import { ReporteAsistencia }  from './reports/ReporteAsistencia';
import { ReporteMaquinas }    from './reports/ReporteMaquinas';
import { ReporteConsolidado } from './reports/ReporteConsolidado';

const REPORT_LABELS: Record<string, string> = {
  asistencia:  'asistencia-sucursal',
  maquinas:    'inventario-maquinas',
  consolidado: 'consolidado-sucursales',
};

interface Props {
  filters: ReportFilters;
  onClose: () => void;
}

export function ReportPreviewModal({ filters, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      // Scroll al inicio del área de preview para que el clon capture desde arriba
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        await new Promise(r => setTimeout(r, 80));
      }
      const date     = new Date().toISOString().slice(0, 10);
      const filename = `gymsync-${REPORT_LABELS[filters.type] ?? filters.type}-${date}`;
      await exportElementToPdf('report-content', filename);
      toast.success('PDF exportado correctamente.');
    } catch (err) {
      console.error('[pdfExport] error:', err);
      toast.error('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  }

  const ReportComponent =
    filters.type === 'asistencia'  ? ReporteAsistencia  :
    filters.type === 'maquinas'    ? ReporteMaquinas    :
    ReporteConsolidado;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#3A3A3C] bg-[#1C1C1E] px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2C2C2E] hover:text-white"
            title="Cerrar vista previa"
          >
            <X size={17} />
          </button>
          <div className="h-5 w-px bg-[#3A3A3C]" />
          <span className="text-sm font-medium text-white">Vista Previa del Reporte</span>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-[#FF5E00] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#e65400] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download size={14} />
              Exportar PDF
            </>
          )}
        </button>
      </div>

      {/* Scrollable preview area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ background: '#141414', padding: '32px 0' }}
      >
        <div
          style={{
            width: 900,
            margin: '0 auto',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            borderRadius: 4,
          }}
        >
          <ReportComponent filters={filters} />
        </div>
      </div>
    </div>
  );
}
