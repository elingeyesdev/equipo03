import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange, DAY_LABELS, DAY_ORDER } from '../types';
import type { FrecuenciaPdfData } from '../pdf/ReporteFrecuenciaPdf';
import { ReportHeader, ReportMetaStrip, ReportKpiGrid, ReportSectionTitle, ReportFooter, ChartEmpty } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsFrecuencia } from '../../../lib/insightsEngine';

const ORANGE = '#FF5E00';
const GREEN  = '#10B981';
const BLUE   = '#2563EB';
const PURPLE = '#7C3AED';
const GRAY   = '#9CA3AF';

const BUCKET_COLORS = [GRAY, GREEN, BLUE, ORANGE, PURPLE];

interface CI { id: number; gymId: number; checkInTime: string; userProfile?: { fullName?: string; role?: string }; }

interface Props {
  filters: ReportFilters;
  onCsvReady?: (rows: string[][]) => void;
  onPdfDataReady?: (data: FrecuenciaPdfData, chartIds: string[]) => void;
}

export function ReporteFrecuencia({ filters, onCsvReady, onPdfDataReady }: Props) {
  const ciUrl = filters.gymId ? `/checkins/gym/${filters.gymId}` : '/checkins';

  const { data: allCI = [], isLoading } = useQuery<CI[]>({
    queryKey: ['rpt-freq-ci', filters.gymId],
    queryFn: async () => {
      const r = await apiClient.get(ciUrl);
      return Array.isArray(r.data) ? r.data : [];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(
    () => allCI.filter(c => inRange(c.checkInTime, filters.range.from, filters.range.to)),
    [allCI, filters.range],
  );

  // Days in range for per-week average
  const days = useMemo(() => Math.max(1, Math.ceil((new Date(filters.range.to).getTime() - new Date(filters.range.from).getTime()) / 86_400_000) + 1), [filters.range]);
  const weeks = Math.max(1, days / 7);

  // Per-user aggregation (by fullName as key since userId may not always be present)
  const perUser = useMemo(() => {
    const map: Record<string, { name: string; role: string; count: number }> = {};
    filtered.forEach(c => {
      const key  = c.userProfile?.fullName ?? `usuario-${c.id}`;
      const role = c.userProfile?.role ?? '—';
      if (!map[key]) map[key] = { name: key, role, count: 0 };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const uniqueUsers  = perUser.length;
  const avgPerUser   = uniqueUsers > 0 ? (filtered.length / uniqueUsers).toFixed(1) : '0';
  const topUser      = perUser[0]?.name ?? '—';

  // Frequency buckets
  const buckets = useMemo(() => {
    const b = { sinActividad: 0, baja: 0, media: 0, alta: 0, muyAlta: 0 };
    perUser.forEach(u => {
      if      (u.count === 0)  b.sinActividad++;
      else if (u.count <= 2)   b.baja++;
      else if (u.count <= 5)   b.media++;
      else if (u.count <= 10)  b.alta++;
      else                      b.muyAlta++;
    });
    return [
      { name: 'Sin actividad (0)',  value: b.sinActividad },
      { name: 'Baja (1–2)',         value: b.baja         },
      { name: 'Media (3–5)',        value: b.media        },
      { name: 'Alta (6–10)',        value: b.alta         },
      { name: 'Muy alta (11+)',     value: b.muyAlta      },
    ].filter(d => d.value > 0);
  }, [perUser]);

  const dayData = useMemo(() => DAY_ORDER.map(d => ({
    name:  DAY_LABELS[d],
    total: filtered.filter(c => new Date(c.checkInTime).getDay() === d).length,
  })), [filtered]);

  const peakDay = [...dayData].sort((a, b) => b.total - a.total)[0];

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const top20 = perUser.slice(0, 20);

  useEffect(() => {
    if (!onCsvReady || isLoading) return;
    const header = ['Usuario', 'Rol', 'Check-ins período', 'Promedio/semana'];
    const csvRows = perUser.map(u => [u.name, u.role, String(u.count), (u.count / weeks).toFixed(1)]);
    onCsvReady([header, ...csvRows]);
  }, [perUser, isLoading, weeks, onCsvReady]);

  useEffect(() => {
    if (!onPdfDataReady || isLoading) return;
    onPdfDataReady(
      {
        gymName: filters.gymName,
        period: `${fmtDate(filters.range.from)} — ${fmtDate(filters.range.to)}`,
        genAt,
        weeks,
        kpis: [
          { label: 'Usuarios únicos',          value: String(uniqueUsers),  accent: '#2563EB' },
          { label: 'Prom. check-ins/usuario',  value: avgPerUser,           accent: '#FF5E00' },
          { label: 'Miembro más activo',        value: topUser,             accent: '#10B981' },
          { label: 'Día más popular',           value: peakDay?.name ?? '—', accent: '#7C3AED' },
        ],
        top20: top20.map(u => ({ name: u.name, role: u.role, count: String(u.count), avgWeek: (u.count / weeks).toFixed(1) })),
        charts: {},
      },
      ['chart-frecuencia-dia', 'chart-frecuencia-buckets'],
    );
  }, [perUser, isLoading, onPdfDataReady]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Calculando frecuencia de entrenamiento...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div id="report-content" style={{ width: 900, backgroundColor: '#ffffff', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: '#111827' }}>
      <ReportHeader title="Frecuencia de Entrenamiento" gymName={filters.gymName} />
      <ReportMetaStrip from={filters.range.from} to={filters.range.to} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Usuarios únicos',         value: uniqueUsers.toString(),  accent: BLUE   },
          { label: 'Prom. check-ins/usuario', value: avgPerUser,              accent: ORANGE },
          { label: 'Miembro más activo',      value: topUser,                 accent: GREEN  },
          { label: 'Día más popular',         value: peakDay?.name ?? '—',   accent: PURPLE },
        ]} />

        <AutoInsights insights={insightsFrecuencia({ uniqueUsers, avgPerUser, peakDay, totalCheckins: filtered.length })} />

        {/* Charts */}
        <ReportSectionTitle>Distribución de Asistencia</ReportSectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div id="chart-frecuencia-dia">
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Check-ins por día de semana</div>
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
          <div id="chart-frecuencia-buckets">
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Usuarios por frecuencia</div>
            {buckets.length > 0 ? (
              <PieChart width={398} height={220}>
                <Pie data={buckets} dataKey="value" nameKey="name" cx={199} cy={95} outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {buckets.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 10, color: '#374151' }}>{v}</span>} />
              </PieChart>
            ) : <ChartEmpty />}
          </div>
        </div>

        {/* Top 20 tabla */}
        <ReportSectionTitle>Top {top20.length} Usuarios más Activos</ReportSectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111111' }}>
              {['#', 'Usuario', 'Rol', 'Check-ins período', 'Prom/semana'].map((h, i) => (
                <th key={h} style={{ padding: '9px 10px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111111' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top20.map((u, i) => (
              <tr key={u.name} style={{ background: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '9px 10px', color: '#9CA3AF', fontWeight: 600, width: 36, fontFamily: 'monospace' }}>{i + 1}</td>
                <td style={{ padding: '9px 10px', color: '#111827', fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '9px 10px', color: '#6B7280' }}>{u.role}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontWeight: 700, fontFamily: 'monospace' }}>{u.count}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontFamily: 'monospace' }}>{(u.count / weeks).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ReportFooter genAt={genAt} />
      </div>
    </div>
  );
}
