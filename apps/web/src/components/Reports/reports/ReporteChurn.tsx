import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, today } from '../types';
import type { ChurnPdfData } from '../pdf/ReporteChurnPdf';
import { ReportHeader, ReportMetaStripSingle, ReportKpiGrid, ReportSectionTitle, ReportFooter } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsChurn } from '../../../lib/insightsEngine';

const GREEN  = '#10B981';
const YELLOW = '#F59E0B';
const RED    = '#EF4444';
const GRAY   = '#9CA3AF';

interface UserItem {
  id: number;
  email?: string;
  isActive?: boolean;
  profile?: { firstName?: string; lastName?: string };
  userRoles?: { gym?: { id: number } | null; role?: { name?: string } | null }[] | null;
}

interface CI {
  id: number;
  gymId: number;
  checkInTime: string;
  userId?: number;
}

type UserStatus = 'activo' | 'en_riesgo' | 'inactivo' | 'sin_historial';

interface Props {
  filters: ReportFilters;
  onCsvReady?: (rows: string[][]) => void;
  onPdfDataReady?: (data: ChurnPdfData, chartIds: string[]) => void;
}

export function ReporteChurn({ filters, onCsvReady, onPdfDataReady }: Props) {
  const { data: allUsers = [], isLoading: lU } = useQuery<UserItem[]>({
    queryKey: ['rpt-churn-users'],
    queryFn: async () => { const r = await apiClient.get('/users'); return Array.isArray(r.data) ? r.data : []; },
    staleTime: 60_000,
  });

  const { data: allCI = [], isLoading: lCI } = useQuery<CI[]>({
    queryKey: ['rpt-churn-ci', filters.gymId],
    queryFn: async () => {
      const url = filters.gymId ? `/checkins/gym/${filters.gymId}` : '/checkins';
      const r = await apiClient.get(url);
      return Array.isArray(r.data) ? r.data : [];
    },
    staleTime: 60_000,
  });

  const loading = lU || lCI;

  // Last check-in per userId
  const lastCI = useMemo(() => {
    const map: Record<number, string> = {};
    allCI.forEach(c => {
      if (!c.userId) return;
      if (!map[c.userId] || c.checkInTime > map[c.userId]) map[c.userId] = c.checkInTime;
    });
    return map;
  }, [allCI]);

  const todayStr  = today();
  const todayDate = new Date(todayStr + 'T00:00:00');

  // Filter users by gym if needed
  const users = useMemo(() => {
    if (!filters.gymId) return allUsers;
    return allUsers.filter(u => u.userRoles?.some(ur => ur.gym?.id === filters.gymId));
  }, [allUsers, filters.gymId]);

  const categorized = useMemo(() => users.map(u => {
    const lastDate = lastCI[u.id];
    let status: UserStatus;
    if (!u.isActive) {
      status = 'inactivo';
    } else if (!lastDate) {
      status = 'sin_historial';
    } else {
      const diffDays = Math.floor((todayDate.getTime() - new Date(lastDate).getTime()) / 86_400_000);
      if      (diffDays <= 30) status = 'activo';
      else if (diffDays <= 90) status = 'en_riesgo';
      else                      status = 'inactivo';
    }
    const name  = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || u.email || `Usuario #${u.id}`;
    const role  = u.userRoles?.[0]?.role?.name ?? '—';
    const lastDate_ = lastCI[u.id];
    const diffDays  = lastDate_ ? Math.floor((todayDate.getTime() - new Date(lastDate_).getTime()) / 86_400_000) : null;
    return { id: u.id, name, email: u.email ?? '—', role, status, diffDays };
  }), [users, lastCI, todayDate]);

  const activos       = categorized.filter(u => u.status === 'activo');
  const enRiesgo      = categorized.filter(u => u.status === 'en_riesgo');
  const inactivos     = categorized.filter(u => u.status === 'inactivo');
  const sinHistorial  = categorized.filter(u => u.status === 'sin_historial');

  const pieData = [
    { name: 'Activos (≤30 días)',      value: activos.length,      color: GREEN  },
    { name: 'En riesgo (31–90 días)',  value: enRiesgo.length,     color: YELLOW },
    { name: 'Inactivos (>90d / off)',  value: inactivos.length,    color: RED    },
    { name: 'Sin historial de CI',     value: sinHistorial.length, color: GRAY   },
  ].filter(d => d.value > 0);

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!onCsvReady || loading) return;
    const statusLabel: Record<UserStatus, string> = { activo: 'Activo', en_riesgo: 'En riesgo', inactivo: 'Inactivo', sin_historial: 'Sin historial' };
    const header = ['Nombre', 'Email', 'Rol', 'Estado', 'Días sin check-in'];
    const csvRows = categorized.map(u => [u.name, u.email, u.role, statusLabel[u.status], u.diffDays !== null ? String(u.diffDays) : '—']);
    onCsvReady([header, ...csvRows]);
  }, [categorized, loading, onCsvReady]);

  useEffect(() => {
    if (!onPdfDataReady || loading) return;
    onPdfDataReady(
      {
        gymName: filters.gymName,
        cutDate: fmtDate(todayStr),
        genAt,
        kpis: [
          { label: 'Total usuarios', value: String(categorized.length), accent: '#6B7280' },
          { label: 'Activos',        value: String(activos.length),     accent: '#10B981' },
          { label: 'En riesgo',      value: String(enRiesgo.length),    accent: '#F59E0B' },
          { label: 'Inactivos',      value: String(inactivos.length),   accent: '#EF4444' },
        ],
        enRiesgo: enRiesgo.sort((a, b) => (b.diffDays ?? 0) - (a.diffDays ?? 0)).map(u => ({
          name: u.name, email: u.email, role: u.role, diffDays: u.diffDays !== null ? String(u.diffDays) : '—',
        })),
        inactivos: inactivos.slice(0, 30).map(u => ({
          name: u.name, email: u.email, role: u.role, diffDays: u.diffDays !== null ? String(u.diffDays) : '—',
        })),
        charts: {},
      },
      ['chart-churn-pie'],
    );
  }, [categorized, loading, onPdfDataReady]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Analizando retención de usuarios...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div id="report-content" style={{ width: 900, backgroundColor: '#ffffff', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: '#111827' }}>
      <ReportHeader title="Retención de Usuarios" gymName={filters.gymName} />
      <ReportMetaStripSingle label="Corte" value={fmtDate(todayStr)} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Total usuarios', value: categorized.length.toString(), accent: '#6B7280' },
          { label: 'Activos',        value: activos.length.toString(),     accent: GREEN    },
          { label: 'En riesgo',      value: enRiesgo.length.toString(),    accent: YELLOW   },
          { label: 'Inactivos',      value: inactivos.length.toString(),   accent: RED      },
        ]} />

        <AutoInsights insights={insightsChurn({ total: categorized.length, activos: activos.length, enRiesgo: enRiesgo.length, inactivos: inactivos.length, sinHistorial: sinHistorial.length })} />

        {/* Donut chart */}
        <ReportSectionTitle>Distribución por Estado de Retención</ReportSectionTitle>
        <div id="chart-churn-pie" style={{ display: 'flex', justifyContent: 'center' }}>
          <PieChart width={500} height={240}>
            <Pie data={pieData} dataKey="value" nameKey="name" cx={250} cy={100} outerRadius={90} innerRadius={50} paddingAngle={3}>
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [`${v} usuarios (${categorized.length > 0 ? Math.round((v / categorized.length) * 100) : 0}%)`, name]}
              contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}
            />
            <Legend iconType="circle" iconSize={10} formatter={v => <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>} />
          </PieChart>
        </div>

        {/* Tabla usuarios en riesgo */}
        {enRiesgo.length > 0 && (
          <>
            <ReportSectionTitle>Usuarios en Riesgo — Requieren Intervención ({enRiesgo.length})</ReportSectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1f2937' }}>
                  {['Usuario', 'Email', 'Rol', 'Días sin check-in', 'Acción sugerida'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 10px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffffff', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enRiesgo.sort((a, b) => (b.diffDays ?? 0) - (a.diffDays ?? 0)).map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#FFFBF0' : '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '9px 10px', color: '#111827', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '9px 10px', color: '#6B7280' }}>{u.email}</td>
                    <td style={{ padding: '9px 10px', color: '#6B7280' }}>{u.role}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: YELLOW, fontWeight: 700 }}>{u.diffDays ?? '—'}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151', fontSize: 11 }}>Contactar y ofrecer incentivo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Tabla usuarios inactivos (isActive=false) */}
        {inactivos.length > 0 && (
          <>
            <ReportSectionTitle>Usuarios Inactivos o Dados de Baja ({inactivos.length})</ReportSectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1f2937' }}>
                  {['Usuario', 'Email', 'Rol', 'Días sin check-in'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 10px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffffff', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inactivos.slice(0, 30).map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#FFF5F5' : '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '9px 10px', color: '#111827', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '9px 10px', color: '#6B7280' }}>{u.email}</td>
                    <td style={{ padding: '9px 10px', color: '#6B7280' }}>{u.role}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: RED }}>{u.diffDays !== null ? u.diffDays : '—'}</td>
                  </tr>
                ))}
                {inactivos.length > 30 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '10px', textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>
                      ... y {inactivos.length - 30} más no mostrados en esta tabla.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Leyenda de criterios */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 8 }}>Criterios de clasificación</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { color: GREEN,  label: 'Activo: último check-in en los últimos 30 días' },
              { color: YELLOW, label: 'En riesgo: sin check-in entre 31 y 90 días' },
              { color: RED,    label: 'Inactivo: sin check-in >90 días o cuenta desactivada' },
              { color: GRAY,   label: 'Sin historial: sin registro de check-in' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#6B7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ReportFooter genAt={genAt} />
      </div>
    </div>
  );
}
