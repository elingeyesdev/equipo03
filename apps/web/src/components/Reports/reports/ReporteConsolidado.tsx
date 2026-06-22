import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { fmtDate, inRange } from '../types';

const ORANGE  = '#FF5E00';
const BLUE    = '#2563EB';
const GREEN   = '#10B981';

// GET /gyms returns branches only (parentId IS NOT NULL) with parent joined
interface GymItem  { id: number; name: string; parentId: number | null; parentName?: string | null; parent?: { id: number; name: string } | null; }
interface UserItem { id: number; isActive: boolean; userRoles?: { gym?: { id: number } | null; role?: { name: string } | null }[] | null; }
interface MachItem { id: string; gymId: number; status: string; }
interface CIItem   { id: number; gymId: number; checkInTime: string; }
interface RsvItem  { id: number; reservationDate: string; gym?: { id: number } | null; }

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

export function ReporteConsolidado({ filters }: Props) {
  const { data: gyms = [],     isLoading: lG  } = useQuery<GymItem[]>({
    queryKey: ['rpt-con-gyms'],
    queryFn: async () => { const r = await apiClient.get('/gyms'); return Array.isArray(r.data) ? r.data : []; },
    staleTime: 60_000,
  });

  const { data: users = [],    isLoading: lU  } = useQuery<UserItem[]>({
    queryKey: ['rpt-con-users'],
    queryFn: async () => { const r = await apiClient.get('/users'); return Array.isArray(r.data) ? r.data : []; },
    staleTime: 60_000,
  });

  const { data: machines = [], isLoading: lM  } = useQuery<MachItem[]>({
    queryKey: ['rpt-con-machines'],
    queryFn: async () => { const r = await apiClient.get('/machines'); return Array.isArray(r.data) ? r.data : []; },
    staleTime: 60_000,
  });

  const { data: checkins = [], isLoading: lCI } = useQuery<CIItem[]>({
    queryKey: ['rpt-con-ci'],
    queryFn: async () => { const r = await apiClient.get('/checkins'); return Array.isArray(r.data) ? r.data : []; },
    staleTime: 60_000,
  });

  const { data: reservations = [], isLoading: lRsv } = useQuery<RsvItem[]>({
    queryKey: ['rpt-con-rsv', filters.range.from, filters.range.to],
    queryFn: async () => {
      const r = await apiClient.get('/reservations', { params: { limit: 100 } });
      return Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    },
    staleTime: 60_000,
  });

  const loading = lG || lU || lM || lCI || lRsv;

  // GET /gyms already returns only branches; no client-side filter needed
  const branches = gyms;

  const branchData = useMemo(() => {
    const ciPer: Record<number, number>  = {};
    const rsvPer: Record<number, number> = {};
    const machPer: Record<number, number> = {};
    const memPer: Record<number, Set<number>> = {};

    checkins.forEach(c => {
      if (c.gymId && inRange(c.checkInTime, filters.range.from, filters.range.to)) {
        ciPer[c.gymId] = (ciPer[c.gymId] ?? 0) + 1;
      }
    });

    reservations.forEach(r => {
      if (r.gym?.id && inRange(r.reservationDate, filters.range.from, filters.range.to)) {
        rsvPer[r.gym.id] = (rsvPer[r.gym.id] ?? 0) + 1;
      }
    });

    machines.forEach(m => {
      machPer[m.gymId] = (machPer[m.gymId] ?? 0) + 1;
    });

    users.forEach(u => {
      u.userRoles?.forEach(ur => {
        if (ur.gym?.id) {
          if (!memPer[ur.gym.id]) memPer[ur.gym.id] = new Set();
          memPer[ur.gym.id].add(u.id);
        }
      });
    });

    return branches.map(b => ({
      id:           b.id,
      name:         b.name,
      brandName:    b.parentName ?? b.parent?.name ?? 'Sin Marca',
      checkins:     ciPer[b.id]  ?? 0,
      reservations: rsvPer[b.id] ?? 0,
      machines:     machPer[b.id] ?? 0,
      members:      memPer[b.id]?.size ?? 0,
    }));
  }, [branches, checkins, reservations, machines, users, filters.range]);

  // Group by brand
  const brandGroups = useMemo(() => {
    const map: Record<string, typeof branchData> = {};
    branchData.forEach(b => {
      if (!map[b.brandName]) map[b.brandName] = [];
      map[b.brandName].push(b);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [branchData]);

  // Summary totals
  const totals = useMemo(() => ({
    members:      branchData.reduce((s, b) => s + b.members, 0),
    checkins:     branchData.reduce((s, b) => s + b.checkins, 0),
    reservations: branchData.reduce((s, b) => s + b.reservations, 0),
    machines:     branchData.reduce((s, b) => s + b.machines, 0),
    branches:     branchData.length,
    brands:       brandGroups.length,
  }), [branchData, brandGroups]);

  const chartData = useMemo(
    () => branchData
      .sort((a, b) => b.checkins - a.checkins)
      .slice(0, 10)
      .map(b => ({ name: b.name.length > 14 ? b.name.slice(0, 13) + '…' : b.name, checkins: b.checkins, reservas: b.reservations })),
    [branchData],
  );

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 14 }}>
        <Loader2 size={28} style={{ color: '#FF5E00', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 13 }}>Consolidando datos de todas las sucursales...</p>
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
          <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 700 }}>Consolidado de Sucursales</div>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Todas las marcas y sucursales</div>
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
        {/* Global KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Marcas',         value: totals.brands,       accent: '#7C3AED' },
            { label: 'Sucursales',     value: totals.branches,     accent: '#6B7280' },
            { label: 'Usuarios activos', value: totals.members,    accent: '#2563EB' },
          ].map(kpi => (
            <div key={kpi.label} style={{ border: '1px solid #E5E7EB', borderLeft: `3px solid ${kpi.accent}`, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ color: '#111827', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{kpi.value.toLocaleString('es-BO')}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
          {[
            { label: 'Check-ins período',    value: totals.checkins,     accent: ORANGE },
            { label: 'Reservas período',     value: totals.reservations, accent: GREEN  },
            { label: 'Máquinas registradas', value: totals.machines,     accent: '#F59E0B' },
          ].map(kpi => (
            <div key={kpi.label} style={{ border: '1px solid #E5E7EB', borderLeft: `3px solid ${kpi.accent}`, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ color: '#111827', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{kpi.value.toLocaleString('es-BO')}</div>
            </div>
          ))}
        </div>

        {/* Bar chart: top branches by activity */}
        {chartData.length > 0 && (
          <>
            <SectionTitle>Actividad por Sucursal — Top {chartData.length}</SectionTitle>
            <BarChart width={820} height={240} data={chartData} margin={{ top: 4, right: 16, bottom: 20, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="checkins" name="Check-ins" fill={ORANGE} radius={[3, 3, 0, 0]} />
              <Bar dataKey="reservas" name="Reservas"   fill={BLUE}   radius={[3, 3, 0, 0]} />
            </BarChart>
          </>
        )}

        {/* Summary table per brand */}
        {brandGroups.map(([brand, branches]) => (
          <div key={brand} style={{ marginBottom: 28 }}>
            <SectionTitle>{brand}</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  {['Sucursal', 'Usuarios', 'Check-ins', 'Reservas', 'Máquinas'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? '#F9FAFB' : '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{b.members.toLocaleString('es-BO')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FF5E00', fontWeight: 700 }}>{b.checkins.toLocaleString('es-BO')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2563EB', fontWeight: 700 }}>{b.reservations.toLocaleString('es-BO')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{b.machines.toLocaleString('es-BO')}</td>
                  </tr>
                ))}
                {/* Brand subtotal */}
                <tr style={{ background: '#F3F4F6', borderTop: '1px solid #D1D5DB' }}>
                  <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 700, fontSize: 11 }}>Subtotal {brand}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151', fontWeight: 700 }}>{branches.reduce((s, b) => s + b.members, 0).toLocaleString('es-BO')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#FF5E00', fontWeight: 700 }}>{branches.reduce((s, b) => s + b.checkins, 0).toLocaleString('es-BO')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#2563EB', fontWeight: 700 }}>{branches.reduce((s, b) => s + b.reservations, 0).toLocaleString('es-BO')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#374151', fontWeight: 700 }}>{branches.reduce((s, b) => s + b.machines, 0).toLocaleString('es-BO')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Grand total row */}
        <div style={{ border: '1px solid #E5E7EB', borderLeft: '3px solid #FF5E00', borderRadius: 8, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBF9' }}>
          <span style={{ color: '#111827', fontWeight: 700, fontSize: 13 }}>Total General</span>
          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' }}>Usuarios</div>
              <div style={{ color: '#111827', fontSize: 16, fontWeight: 700 }}>{totals.members.toLocaleString('es-BO')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' }}>Check-ins</div>
              <div style={{ color: '#FF5E00', fontSize: 16, fontWeight: 700 }}>{totals.checkins.toLocaleString('es-BO')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' }}>Reservas</div>
              <div style={{ color: '#2563EB', fontSize: 16, fontWeight: 700 }}>{totals.reservations.toLocaleString('es-BO')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' }}>Máquinas</div>
              <div style={{ color: '#374151', fontSize: 16, fontWeight: 700 }}>{totals.machines.toLocaleString('es-BO')}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>GymSync — Reporte Consolidado Interno</span>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>{genAt}</span>
        </div>
      </div>
    </div>
  );
}
