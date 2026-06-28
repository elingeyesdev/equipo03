import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange, normalizeStatus, DAY_LABELS, DAY_ORDER } from '../types';
import type { CancelacionesPdfData } from '../pdf/ReporteCancelacionesPdf';
import { ReportHeader, ReportMetaStrip, ReportKpiGrid, ReportSectionTitle, ReportFooter, ChartEmpty } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsCancelaciones } from '../../../lib/insightsEngine';

const GREEN  = '#10B981';
const ORANGE = '#FF5E00';
const RED    = '#EF4444';
const GRAY   = '#9CA3AF';
const BLUE   = '#2563EB';

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
  onPdfDataReady?: (data: CancelacionesPdfData, chartIds: string[]) => void;
}

function activityName(r: Rsv): string {
  return r.freeActivity?.name ?? r.gymActivitySchedule?.gymActivity?.name ?? 'Libre / Sin actividad';
}

export function ReporteCancelaciones({ filters, onCsvReady, onPdfDataReady }: Props) {
  const { data: allRsv = [], isLoading } = useQuery<Rsv[]>({
    queryKey: ['rpt-cancel-rsv', filters.gymId, filters.range.from, filters.range.to],
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

  const counts = useMemo(() => {
    let confirmada = 0, completada = 0, cancelada = 0, pendiente = 0, otra = 0;
    reservas.forEach(r => {
      const ns = normalizeStatus(r.status);
      if (ns === 'confirmada')  confirmada++;
      else if (ns === 'completada') completada++;
      else if (ns === 'cancelada')  cancelada++;
      else if (ns === 'pendiente')  pendiente++;
      else otra++;
    });
    return { confirmada, completada, cancelada, pendiente, otra };
  }, [reservas]);

  const cancelRate = reservas.length > 0 ? Math.round((counts.cancelada / reservas.length) * 100) : 0;
  const pendRate   = reservas.length > 0 ? Math.round((counts.pendiente / reservas.length) * 100) : 0;

  const pieData = [
    { name: 'Completadas',  value: counts.completada, color: GREEN  },
    { name: 'Confirmadas',  value: counts.confirmada, color: ORANGE },
    { name: 'Canceladas',   value: counts.cancelada,  color: RED    },
    { name: 'Pendientes',   value: counts.pendiente,  color: GRAY   },
  ].filter(d => d.value > 0);

  // Cancelaciones por día de semana
  const dayData = useMemo(() => DAY_ORDER.map(d => ({
    name: DAY_LABELS[d],
    canceladas: reservas.filter(r => normalizeStatus(r.status) === 'cancelada' && new Date(r.reservationDate + 'T00:00:00').getDay() === d).length,
  })), [reservas]);

  // Top actividades por cancelación
  const byActivity = useMemo(() => {
    const map: Record<string, { total: number; cancelada: number }> = {};
    reservas.forEach(r => {
      const name = activityName(r);
      if (!map[name]) map[name] = { total: 0, cancelada: 0 };
      map[name].total++;
      if (normalizeStatus(r.status) === 'cancelada') map[name].cancelada++;
    });
    return Object.entries(map)
      .filter(([, d]) => d.cancelada > 0)
      .sort((a, b) => b[1].cancelada - a[1].cancelada)
      .slice(0, 10)
      .map(([name, d]) => ({
        name,
        total:    d.total,
        cancelada: d.cancelada,
        tasa:     Math.round((d.cancelada / d.total) * 100),
      }));
  }, [reservas]);

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!onCsvReady || isLoading) return;
    const header = ['Actividad', 'Total reservas', 'Canceladas', 'Tasa cancelación%'];
    const csvRows = byActivity.map(a => [a.name, String(a.total), String(a.cancelada), String(a.tasa)]);
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
          { label: 'Total reservas',        value: reservas.length.toLocaleString('es-BO'),              accent: '#6B7280' },
          { label: 'Canceladas',            value: `${counts.cancelada} (${cancelRate}%)`,               accent: '#EF4444' },
          { label: 'Pendientes sin comp.',  value: `${counts.pendiente} (${pendRate}%)`,                 accent: '#9CA3AF' },
          { label: 'Actividades afectadas', value: String(byActivity.length),                            accent: '#2563EB' },
        ],
        byActivity: byActivity.map(a => ({ name: a.name, total: String(a.total), cancelada: String(a.cancelada), tasa: String(a.tasa) })),
        charts: {},
      },
      ['chart-cancelaciones-charts'],
    );
  }, [byActivity, isLoading, onPdfDataReady]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Cargando datos de cancelaciones...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div id="report-content" style={{ width: 900, backgroundColor: '#ffffff', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: '#111827' }}>
      <ReportHeader title="Cancelaciones y No-Shows" gymName={filters.gymName} />
      <ReportMetaStrip from={filters.range.from} to={filters.range.to} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Total reservas',       value: reservas.length.toLocaleString('es-BO'), accent: '#6B7280' },
          { label: 'Canceladas',           value: `${counts.cancelada} (${cancelRate}%)`,  accent: RED      },
          { label: 'Pendientes sin comp.', value: `${counts.pendiente} (${pendRate}%)`,    accent: GRAY     },
          { label: 'Actividades afectadas', value: byActivity.length.toString(),           accent: BLUE     },
        ]} />

        <AutoInsights insights={insightsCancelaciones({ total: reservas.length, canceladas: counts.cancelada, cancelRate, byActivity })} />

        {/* Pie + Bar chart */}
        <ReportSectionTitle>Distribución por Estado y Día de Semana</ReportSectionTitle>
        <div id="chart-cancelaciones-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por estado</div>
            {pieData.length > 0 ? (
              <PieChart width={398} height={220}>
                <Pie data={pieData} dataKey="value" nameKey="name" cx={199} cy={95} outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
              </PieChart>
            ) : <ChartEmpty />}
          </div>
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Cancelaciones por día</div>
            {dayData.some(d => d.canceladas > 0) ? (
              <BarChart width={398} height={200} data={dayData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
                <Bar dataKey="canceladas" fill={RED} radius={[3, 3, 0, 0]} name="Canceladas" />
              </BarChart>
            ) : <ChartEmpty />}
          </div>
        </div>

        {/* Tabla actividades con más cancelaciones */}
        {byActivity.length > 0 && (
          <>
            <ReportSectionTitle>Actividades con Más Cancelaciones</ReportSectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #111111' }}>
                  {['Actividad', 'Total reservas', 'Canceladas', 'Tasa cancelación%'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 10px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111111' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byActivity.map((a) => (
                  <tr key={a.name} style={{ background: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '9px 10px', color: '#111827', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{a.total}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontWeight: 700, fontFamily: 'monospace' }}>{a.cancelada}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontWeight: a.tasa >= 30 ? 700 : 400, fontFamily: 'monospace' }}>{a.tasa}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <ReportFooter genAt={genAt} />
      </div>
    </div>
  );
}
