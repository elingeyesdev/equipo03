import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS, fmtDate } from '../types';

const STATUS_COLORS_PDF: Record<string, string> = {
  AVAILABLE:   '#10B981',
  IN_USE:      '#FF5E00',
  MAINTENANCE: '#EF4444',
};

const CATEGORY_COLORS = ['#FF5E00', '#2563EB', '#10B981', '#7C3AED', '#F59E0B'];

interface Machine {
  id: string;
  gymId: number;
  name: string;
  status: string;
  category: string;
  updatedAt: string;
  gym?: { id: number; name: string };
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

export function ReporteMaquinas({ filters }: Props) {
  const { data: allMachines = [], isLoading } = useQuery<Machine[]>({
    queryKey: ['rpt-machines', filters.gymId],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filters.gymId) params.gymId = filters.gymId;
      const r = await apiClient.get('/machines', { params });
      return Array.isArray(r.data) ? r.data : [];
    },
    staleTime: 60_000,
  });

  const machines = useMemo(
    () => filters.gymId ? allMachines.filter(m => m.gymId === filters.gymId) : allMachines,
    [allMachines, filters.gymId],
  );

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
    machines.forEach(m => { if (m.status in counts) counts[m.status]++; });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      value,
      key,
    })).filter(e => e.value > 0);
  }, [machines]);

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    machines.forEach(m => {
      const cat = m.category ?? 'SIN_CATEGORIA';
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ name: CATEGORY_LABELS[key] ?? key, value, key }));
  }, [machines]);

  const maintenance = useMemo(
    () => machines.filter(m => m.status === 'MAINTENANCE'),
    [machines],
  );

  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
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
          <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 700 }}>Inventario de Máquinas</div>
          {filters.gymName && <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{filters.gymName}</div>}
        </div>
      </div>

      {/* Meta strip */}
      <div style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '10px 40px', display: 'flex', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Fecha de corte</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{fmtDate(filters.range.to)}</div>
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
            { label: 'Total de máquinas',    value: machines.length.toString(),                                     accent: '#6B7280' },
            { label: 'Disponibles',           value: byStatus.find(s => s.key === 'AVAILABLE')?.value.toString() ?? '0',    accent: '#10B981' },
            { label: 'En uso',                value: byStatus.find(s => s.key === 'IN_USE')?.value.toString() ?? '0',       accent: '#FF5E00' },
            { label: 'En mantenimiento',      value: byStatus.find(s => s.key === 'MAINTENANCE')?.value.toString() ?? '0',  accent: '#EF4444' },
          ].map(kpi => (
            <div key={kpi.label} style={{ border: '1px solid #E5E7EB', borderLeft: `3px solid ${kpi.accent}`, borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ color: '#111827', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Pie charts */}
        <SectionTitle>Distribución del Inventario</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* By category */}
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por categoría</div>
            <PieChart width={398} height={220}>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx={199} cy={95}
                outerRadius={70}
                innerRadius={35}
                paddingAngle={3}
              >
                {byCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
            </PieChart>
          </div>

          {/* By status */}
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Por estado</div>
            <PieChart width={398} height={220}>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                cx={199} cy={95}
                outerRadius={70}
                innerRadius={35}
                paddingAngle={3}
              >
                {byStatus.map(e => <Cell key={e.key} fill={STATUS_COLORS_PDF[e.key] ?? '#9CA3AF'} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
            </PieChart>
          </div>
        </div>

        {/* Category bar chart */}
        <SectionTitle>Máquinas por Categoría</SectionTitle>
        <BarChart width={820} height={180} data={byCategory} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
          <Bar dataKey="value" name="Máquinas" radius={[3, 3, 0, 0]}>
            {byCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
          </Bar>
        </BarChart>

        {/* Maintenance list */}
        {maintenance.length > 0 && (
          <>
            <SectionTitle>Máquinas Pendientes de Mantenimiento</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  {['Máquina', 'Categoría', 'Sucursal', 'Últ. actualización'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maintenance.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#FFF5F5' : '#ffffff', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{CATEGORY_LABELS[m.category] ?? m.category}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{m.gym?.name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>
                      {new Date(m.updatedAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Full inventory table (grouped by category) */}
        <SectionTitle>Inventario Completo</SectionTitle>
        {byCategory.map(cat => {
          const catMachines = machines.filter(m => (CATEGORY_LABELS[m.category] ?? m.category) === cat.name);
          return (
            <div key={cat.key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                {cat.name}
                <span style={{ marginLeft: 8, color: '#9CA3AF', fontWeight: 400 }}>({catMachines.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {catMachines.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: STATUS_COLORS_PDF[m.status] ?? '#9CA3AF' }}
                    />
                    <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>GymSync — Sistema de Gestión Deportiva</span>
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>{genAt}</span>
        </div>
      </div>
    </div>
  );
}
