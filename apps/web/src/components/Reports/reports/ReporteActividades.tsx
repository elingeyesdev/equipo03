import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange, normalizeStatus } from '../types';
import type { ActividadesPdfData } from '../pdf/ReporteActividadesPdf';
import { ReportHeader, ReportMetaStrip, ReportKpiGrid, ReportSectionTitle, ReportFooter } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsActividades } from '../../../lib/insightsEngine';

const GREEN  = '#10B981';
const ORANGE = '#FF5E00';
const RED    = '#EF4444';
const GRAY   = '#9CA3AF';

interface Rsv {
  id: number;
  reservationDate: string;
  status: string;
  gym?: { id: number } | null;
  freeActivity?: { name: string } | null;
  gymActivitySchedule?: { gymActivity?: { name: string } | null } | null;
}

interface Props {
  filters: ReportFilters;
  onCsvReady?: (rows: string[][]) => void;
  onPdfDataReady?: (data: ActividadesPdfData, chartIds: string[]) => void;
}

function activityName(r: Rsv): string {
  return r.freeActivity?.name ?? r.gymActivitySchedule?.gymActivity?.name ?? 'Libre / Sin actividad';
}

export function ReporteActividades({ filters, onCsvReady, onPdfDataReady }: Props) {
  const { data: allRsv = [], isLoading } = useQuery<Rsv[]>({
    queryKey: ['rpt-act-rsv', filters.gymId, filters.range.from, filters.range.to],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 2000 };
      if (filters.gymId) params.gymId = filters.gymId;
      const r = await apiClient.get('/reservations', { params });
      return Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    },
    staleTime: 60_000,
  });

  const reservas = useMemo(
    () => allRsv.filter(r =>
      inRange(r.reservationDate, filters.range.from, filters.range.to) &&
      (!filters.gymId || r.gym?.id === filters.gymId)
    ),
    [allRsv, filters],
  );

  const byActivity = useMemo(() => {
    const map: Record<string, { total: number; confirmada: number; completada: number; cancelada: number; pendiente: number }> = {};
    reservas.forEach(r => {
      const name = activityName(r);
      if (!map[name]) map[name] = { total: 0, confirmada: 0, completada: 0, cancelada: 0, pendiente: 0 };
      const ns = normalizeStatus(r.status);
      map[name].total++;
      if (ns === 'confirmada') map[name].confirmada++;
      else if (ns === 'completada') map[name].completada++;
      else if (ns === 'cancelada') map[name].cancelada++;
      else map[name].pendiente++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => ({
        name,
        ...d,
        cancelRate: d.total > 0 ? Math.round((d.cancelada / d.total) * 100) : 0,
      }));
  }, [reservas]);

  const total        = reservas.length;
  const completadas  = byActivity.reduce((s, a) => s + a.completada, 0);
  const canceladas   = byActivity.reduce((s, a) => s + a.cancelada, 0);
  const pctComp      = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const pctCancel    = total > 0 ? Math.round((canceladas  / total) * 100) : 0;
  const limit = filters.topN ?? 10;
  const topActivities = limit > 0 ? byActivity.slice(0, limit) : byActivity;

  const chartData = topActivities.map(a => ({
    name: a.name.length > 18 ? a.name.slice(0, 17) + '…' : a.name,
    Completadas: a.completada,
    Confirmadas: a.confirmada,
    Canceladas:  a.cancelada,
    Pendientes:  a.pendiente,
  }));

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!onCsvReady || isLoading) return;
    const header = ['Actividad', 'Total', 'Confirmadas', 'Completadas', 'Canceladas', 'Pendientes', 'Tasa cancelación%'];
    const csvRows = byActivity.map(a => [a.name, String(a.total), String(a.confirmada), String(a.completada), String(a.cancelada), String(a.pendiente), String(a.cancelRate)]);
    onCsvReady([header, ...csvRows]);
  }, [byActivity, isLoading, onCsvReady]);

  useEffect(() => {
    if (!onPdfDataReady || isLoading) return;
    onPdfDataReady(
      {
        gymName: filters.gymName,
        period: `${fmtDate(filters.range.from)} — ${fmtDate(filters.range.to)}`,
        genAt,
        kpis: [
          { label: 'Total reservas', value: total.toLocaleString('es-BO'),        accent: '#6B7280' },
          { label: 'Completadas',    value: `${completadas} (${pctComp}%)`,       accent: '#10B981' },
          { label: 'Canceladas',     value: `${canceladas} (${pctCancel}%)`,      accent: '#EF4444' },
          { label: 'Actividades',    value: String(byActivity.length),            accent: '#FF5E00' },
        ],
        byActivity: byActivity.map(a => ({
          name: a.name, total: String(a.total), confirmada: String(a.confirmada),
          completada: String(a.completada), cancelada: String(a.cancelada),
          pendiente: String(a.pendiente), cancelRate: String(a.cancelRate),
        })),
        charts: {},
      },
      ['chart-actividades-bar'],
    );
  }, [byActivity, isLoading, onPdfDataReady]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Cargando datos de actividades...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div id="report-content" style={{ width: 900, backgroundColor: '#ffffff', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: '#111827' }}>
      <ReportHeader title="Rendimiento de Actividades" gymName={filters.gymName} />
      <ReportMetaStrip from={filters.range.from} to={filters.range.to} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Total reservas', value: total.toLocaleString('es-BO'),      accent: '#6B7280' },
          { label: 'Completadas',    value: `${completadas} (${pctComp}%)`,    accent: GREEN    },
          { label: 'Canceladas',     value: `${canceladas} (${pctCancel}%)`,   accent: RED      },
          { label: 'Actividades',    value: byActivity.length.toString(),       accent: ORANGE   },
        ]} />

        <AutoInsights insights={insightsActividades({ total, pctComp, pctCancel, topActivity: byActivity[0] ? { name: byActivity[0].name, total: byActivity[0].total } : undefined })} />

        {/* Bar chart apilado */}
        {chartData.length > 0 && (
          <>
            <ReportSectionTitle>Top {topActivities.length} Actividades por Reservas</ReportSectionTitle>
            <div id="chart-actividades-bar">
            <BarChart width={820} height={220} data={chartData} margin={{ top: 4, right: 16, bottom: 40, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
              <Bar dataKey="Completadas" stackId="a" fill={GREEN}  radius={[0, 0, 0, 0]} />
              <Bar dataKey="Confirmadas" stackId="a" fill={ORANGE} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Canceladas"  stackId="a" fill={RED}    radius={[0, 0, 0, 0]} />
              <Bar dataKey="Pendientes"  stackId="a" fill={GRAY}   radius={[3, 3, 0, 0]} />
            </BarChart>
            {/* Leyenda */}
            <div style={{ display: 'flex', gap: 20, marginTop: 8, justifyContent: 'center' }}>
              {[['Completadas', GREEN], ['Confirmadas', ORANGE], ['Canceladas', RED], ['Pendientes', GRAY]].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{l}</span>
                </div>
              ))}
            </div>
            </div>
          </>
        )}

        {/* Tabla */}
        <ReportSectionTitle>Detalle por Actividad</ReportSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111111' }}>
              {['Actividad', 'Total', 'Confirmadas', 'Completadas', 'Canceladas', 'Pend.', 'Cancelación%'].map((h, i) => (
                <th key={h} style={{ padding: '9px 10px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111111' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byActivity.map((a) => (
              <tr key={a.name} style={{ background: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '9px 10px', color: '#111827', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontWeight: 600, fontFamily: 'monospace' }}>{a.total}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{a.confirmada}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{a.completada}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{a.cancelada}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{a.pendiente}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontWeight: a.cancelRate >= 30 ? 700 : 400, fontFamily: 'monospace' }}>{a.cancelRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ReportFooter genAt={genAt} />
      </div>
    </div>
  );
}
