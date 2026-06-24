import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange, DAY_LABELS, DAY_ORDER } from '../types';

const ORANGE = '#FF5E00';
const BLUE   = '#2563EB';

interface CI  { id: number; gymId: number; checkInTime: string; }
interface Rsv {
  id: number; reservationDate: string;
  gym?: { id: number };
  freeActivity?: { name: string } | null;
  gymActivitySchedule?: { gymActivity?: { name: string } | null } | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18, marginTop: 32 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#FF5E00', margin: 0 }}>
        {children}
      </h3>
      <div style={{ height: 2, background: '#FF5E00', width: 28, marginTop: 6, borderRadius: 1 }} />
    </div>
  );
}

interface Props { filters: ReportFilters; }

export function ReporteAsistencia({ filters }: Props) {
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
      const params: Record<string, any> = { limit: 100 };
      if (filters.gymId) params.gymId = filters.gymId;
      const r = await apiClient.get('/reservations', { params });
      return Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    },
    staleTime: 60_000,
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

  const hourData = useMemo(() =>
    Array.from({ length: 9 }, (_, i) => {
      const h = 6 + i * 2;
      return {
        name: `${String(h).padStart(2, '0')}h`,
        total: filtered.filter(c => {
          const hr = new Date(c.checkInTime).getHours();
          return hr >= h && hr < Math.min(h + 2, 24);
        }).length,
      };
    }),
    [filtered],
  );

  const now      = new Date();
  const prev     = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currYM   = now.toISOString().slice(0, 7);
  const prevYM   = prev.toISOString().slice(0, 7);
  const currLbl  = now.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' });
  const prevLbl  = prev.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' });

  const monthlyData = [
    { name: prevLbl, total: allCI.filter(c => c.checkInTime.startsWith(prevYM)).length },
    { name: currLbl, total: allCI.filter(c => c.checkInTime.startsWith(currYM)).length },
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
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', padding: '26px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#FF5E00', fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>GYMSYNC</div>
          <div style={{ color: '#9CA3AF', fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 3 }}>Sistema de Gestión Deportiva</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 700 }}>Asistencia por Sucursal</div>
          {filters.gymName && <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{filters.gymName}</div>}
        </div>
      </div>

      {/* Meta strip */}
      <div style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '10px 40px', display: 'flex', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Período</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{fmtDate(filters.range.from)} — {fmtDate(filters.range.to)}</div>
        </div>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Generado</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{genAt}</div>
        </div>
      </div>

      <div style={{ padding: '28px 40px 40px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Check-ins totales', value: total.toLocaleString('es-BO') },
            { label: 'Promedio diario',   value: avgDay },
            { label: 'Hora pico',         value: peakHr?.name ?? '—' },
            { label: 'Día más activo',    value: peakDay?.name ?? '—' },
          ].map(kpi => (
            <div key={kpi.label} style={{ border: '1px solid #E5E7EB', borderLeft: '3px solid #FF5E00', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ color: '#111827', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Day & hour charts */}
        <SectionTitle>Distribución de Asistencia</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por día de semana</div>
            <BarChart width={398} height={200} data={dayData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} cursor={{ fill: '#FFF5F0' }} />
              <Bar dataKey="total" fill={ORANGE} radius={[3, 3, 0, 0]} name="Check-ins" />
            </BarChart>
          </div>
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por franja horaria</div>
            <BarChart width={398} height={200} data={hourData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} cursor={{ fill: '#EFF6FF' }} />
              <Bar dataKey="total" fill={BLUE} radius={[3, 3, 0, 0]} name="Check-ins" />
            </BarChart>
          </div>
        </div>

        {/* Monthly comparison */}
        <SectionTitle>Comparativo Mensual</SectionTitle>
        <BarChart width={820} height={160} data={monthlyData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={72} />
          <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Check-ins">
            {monthlyData.map((_, i) => <Cell key={i} fill={i === 1 ? ORANGE : '#D1D5DB'} />)}
          </Bar>
        </BarChart>

        {/* Top activities */}
        {topActivities.length > 0 && (
          <>
            <SectionTitle>Actividades con Más Reservas</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  {['#', 'Actividad', 'Reservas totales'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: i === 2 ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topActivities.map((a, i) => (
                  <tr key={a.name} style={{ background: i % 2 === 0 ? '#F9FAFB' : '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', width: 36, color: '#9CA3AF', fontWeight: 600 }}>{a.rank}</td>
                    <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FF5E00', fontWeight: 700 }}>{a.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 14, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>GymSync — Sistema de Gestión Deportiva</span>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>{genAt}</span>
        </div>
      </div>
    </div>
  );
}
