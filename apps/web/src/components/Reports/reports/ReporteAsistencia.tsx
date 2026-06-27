import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange, DAY_LABELS, DAY_ORDER } from '../types';
import type { GymScheduleDto } from '../../../components/Dashboard/Shared/DashboardTypes';
import type { AsistenciaPdfData } from '../pdf/ReporteAsistenciaPdf';
import { ReportHeader, ReportMetaStrip, ReportKpiGrid, ReportSectionTitle, ReportFooter, ChartEmpty } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsAsistencia } from '../../../lib/insightsEngine';

const ORANGE = '#FF5E00';
const BLUE   = '#2563EB';

interface CI  { id: number; gymId: number; checkInTime: string; }
interface Rsv {
  id: number; reservationDate: string;
  gym?: { id: number };
  freeActivity?: { name: string } | null;
  gymActivitySchedule?: { gymActivity?: { name: string } | null } | null;
}

interface Props {
  filters: ReportFilters;
  onCsvReady?: (rows: string[][]) => void;
  onPdfDataReady?: (data: AsistenciaPdfData, chartIds: string[]) => void;
}

export function ReporteAsistencia({ filters, onCsvReady, onPdfDataReady }: Props) {
  const ciUrl = filters.gymId ? `/checkins/gym/${filters.gymId}` : '/checkins';

  const { data: allCI = [], isLoading: loadCI } = useQuery<CI[]>({
    queryKey: ['rpt-ci', filters.gymId],
    queryFn: async () => {
      const r = await apiClient.get(ciUrl);
      return Array.isArray(r.data) ? r.data : [];
    },
    staleTime: 60_000,
  });

  const { data: allRsv = [], isLoading: loadRsv } = useQuery<Rsv[]>({
    queryKey: ['rpt-rsv', filters.gymId, filters.range.from, filters.range.to],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 2000 };
      if (filters.gymId) params.gymId = filters.gymId;
      const r = await apiClient.get('/reservations', { params });
      return Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    },
    staleTime: 60_000,
  });

  const { data: gymSchedules = [] } = useQuery<GymScheduleDto[]>({
    queryKey: ['rpt-gym-schedules', filters.gymId],
    queryFn: async () => {
      if (!filters.gymId) return [];
      const r = await apiClient.get(`/gyms/${filters.gymId}/schedules`);
      return Array.isArray(r.data) ? r.data : [];
    },
    enabled: !!filters.gymId,
    staleTime: 5 * 60_000,
  });

  const loading = loadCI || loadRsv;

  const filtered = useMemo(
    () => allCI.filter(c => inRange(c.checkInTime, filters.range.from, filters.range.to)),
    [allCI, filters.range],
  );

  const dayData = useMemo(() =>
    DAY_ORDER.map(d => ({
      name: DAY_LABELS[d],
      total: filtered.filter(c => new Date(c.checkInTime).getDay() === d).length,
    })),
    [filtered],
  );

  // Franja horaria dinámica desde los horarios reales del gym
  const activeSchedules = gymSchedules.filter(s => !s.isHoliday);
  const opensHour  = activeSchedules.length
    ? Math.min(...activeSchedules.map(s => parseInt(s.opensAt)))
    : 6;
  const closesHour = activeSchedules.length
    ? Math.max(...activeSchedules.map(s => parseInt(s.closesAt)))
    : 22;
  const slotCount  = Math.max(1, Math.ceil((closesHour - opensHour) / 2));

  const hourData = useMemo(() =>
    Array.from({ length: slotCount }, (_, i) => {
      const h = opensHour + i * 2;
      return {
        name: `${String(h).padStart(2, '0')}h`,
        total: filtered.filter(c => {
          const hr = new Date(c.checkInTime).getHours();
          return hr >= h && hr < Math.min(h + 2, closesHour);
        }).length,
      };
    }),
    [filtered, opensHour, closesHour, slotCount],
  );

  // Comparativo: período anterior de igual duración al rango seleccionado
  const fromDate = new Date(filters.range.from + 'T00:00:00');
  const toDate   = new Date(filters.range.to   + 'T00:00:00');
  const diffMs   = toDate.getTime() - fromDate.getTime();
  const prevTo   = new Date(fromDate.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime()   - diffMs);
  const prevFromStr = prevFrom.toISOString().slice(0, 10);
  const prevToStr   = prevTo.toISOString().slice(0, 10);

  const currLbl = `${fmtDate(filters.range.from)} – ${fmtDate(filters.range.to)}`;
  const prevLbl = `${fmtDate(prevFromStr)} – ${fmtDate(prevToStr)}`;

  const monthlyData = [
    { name: prevLbl, total: allCI.filter(c => inRange(c.checkInTime, prevFromStr, prevToStr)).length },
    { name: currLbl, total: filtered.length },
  ];

  const topActivities = useMemo(() => {
    const count: Record<string, number> = {};
    allRsv
      .filter(r =>
        inRange(r.reservationDate, filters.range.from, filters.range.to) &&
        (!filters.gymId || r.gym?.id === filters.gymId),
      )
      .forEach(r => {
        const name = r.freeActivity?.name ?? r.gymActivitySchedule?.gymActivity?.name ?? null;
        if (name) count[name] = (count[name] ?? 0) + 1;
      });
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total], i) => ({ name, total, rank: i + 1 }));
  }, [allRsv, filters]);

  const total   = filtered.length;
  const days    = Math.max(1, Math.ceil((new Date(filters.range.to).getTime() - new Date(filters.range.from).getTime()) / 86_400_000) + 1);
  const avgDay  = (total / days).toFixed(1);
  const peakDay = [...dayData].sort((a, b) => b.total - a.total)[0];
  const peakHr  = [...hourData].sort((a, b) => b.total - a.total)[0];

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!onCsvReady || loading) return;
    const dayMap: Record<string, number> = {};
    filtered.forEach(c => {
      const d = c.checkInTime.slice(0, 10);
      dayMap[d] = (dayMap[d] ?? 0) + 1;
    });
    const header = ['Fecha', 'Día', 'Check-ins'];
    const rows = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([d, n]) => [d, DAY_LABELS[new Date(d + 'T00:00:00').getDay()], String(n)]);
    onCsvReady([header, ...rows]);
  }, [filtered, loading, onCsvReady]);

  useEffect(() => {
    if (!onPdfDataReady || loading) return;
    const period = `${fmtDate(filters.range.from)} — ${fmtDate(filters.range.to)}`;
    onPdfDataReady(
      {
        gymName: filters.gymName,
        period,
        genAt,
        kpis: [
          { label: 'Check-ins totales', value: total.toLocaleString('es-BO'),  accent: '#FF5E00' },
          { label: 'Promedio diario',   value: avgDay,                          accent: '#2563EB' },
          { label: 'Hora pico',         value: peakHr?.name ?? '—',            accent: '#10B981' },
          { label: 'Día más activo',    value: peakDay?.name ?? '—',           accent: '#7C3AED' },
        ],
        topActividades: topActivities.map(a => ({ name: a.name, total: a.total })),
        charts: {},
      },
      ['chart-asistencia-dia', 'chart-asistencia-hora', 'chart-asistencia-mensual'],
    );
  }, [filtered, loading, onPdfDataReady]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Cargando datos del reporte...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      id="report-content"
      style={{ width: 900, backgroundColor: '#ffffff', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: '#111827' }}
    >
      <ReportHeader title="Asistencia por Sucursal" gymName={filters.gymName} />
      <ReportMetaStrip from={filters.range.from} to={filters.range.to} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Check-ins totales', value: total.toLocaleString('es-BO'), accent: '#FF5E00' },
          { label: 'Promedio diario',   value: avgDay,                         accent: '#2563EB' },
          { label: 'Hora pico',         value: peakHr?.name ?? '—',           accent: '#10B981' },
          { label: 'Día más activo',    value: peakDay?.name ?? '—',          accent: '#7C3AED' },
        ]} />

        <AutoInsights insights={insightsAsistencia({ total, avgDay, peakHr, peakDay, topActivities, days })} />

        {/* Day & hour charts */}
        <ReportSectionTitle>Distribución de Asistencia</ReportSectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div id="chart-asistencia-dia">
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por día de semana</div>
            {dayData.some(d => d.total > 0) ? (
              <BarChart width={398} height={200} data={dayData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="total" fill={ORANGE} radius={[3, 3, 0, 0]} name="Check-ins" />
              </BarChart>
            ) : <ChartEmpty />}
          </div>
          <div id="chart-asistencia-hora">
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por franja horaria</div>
            {hourData.some(d => d.total > 0) ? (
              <BarChart width={398} height={200} data={hourData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="total" fill={BLUE} radius={[3, 3, 0, 0]} name="Check-ins" />
              </BarChart>
            ) : <ChartEmpty />}
          </div>
        </div>

        {/* Monthly comparison */}
        <ReportSectionTitle>Comparativo Mensual</ReportSectionTitle>
        <div id="chart-asistencia-mensual">
          {monthlyData.some(d => d.total > 0) ? (
            <BarChart width={820} height={160} data={monthlyData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={148}
                tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 18) + '…' : v}
              />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Check-ins">
                {monthlyData.map((_, i) => <Cell key={i} fill={i === 1 ? ORANGE : '#D1D5DB'} />)}
              </Bar>
            </BarChart>
          ) : <ChartEmpty height={160} />}
        </div>

        {/* Top activities */}
        {topActivities.length > 0 && (
          <>
            <ReportSectionTitle>Actividades con Más Reservas</ReportSectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #111111' }}>
                  {['#', 'Actividad', 'Reservas totales'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: i === 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111111' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topActivities.map((a) => (
                  <tr key={a.name} style={{ background: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '10px 12px', width: 36, color: '#9CA3AF', fontWeight: 600, fontFamily: 'monospace' }}>{a.rank}</td>
                    <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151', fontWeight: 700, fontFamily: 'monospace' }}>{a.total}</td>
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
