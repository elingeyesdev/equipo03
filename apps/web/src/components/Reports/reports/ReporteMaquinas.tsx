import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../infrastructure/api.config';
import type { ReportFilters } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS, fmtDate } from '../types';
import type { MaquinasPdfData } from '../pdf/ReporteMaquinasPdf';
import { ReportHeader, ReportMetaStripSingle, ReportKpiGrid, ReportSectionTitle, ReportFooter } from './preview-shared';
import { AutoInsights } from '../AutoInsights';
import { insightsMaquinas } from '../../../lib/insightsEngine';

const STATUS_COLORS_PDF: Record<string, string> = {
  AVAILABLE:   '#10B981',
  IN_USE:      '#2563EB',
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

interface Props {
  filters: ReportFilters;
  onCsvReady?: (rows: string[][]) => void;
  onPdfDataReady?: (data: MaquinasPdfData, chartIds: string[]) => void;
}

export function ReporteMaquinas({ filters, onCsvReady, onPdfDataReady }: Props) {
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

  useEffect(() => {
    if (!onCsvReady || isLoading) return;
    const header = ['ID', 'Nombre', 'Estado', 'Categoría', 'Sede', 'Última actualización'];
    const rows = machines.map(m => [
      m.id,
      m.name,
      STATUS_LABELS[m.status] ?? m.status,
      CATEGORY_LABELS[m.category] ?? m.category,
      m.gym?.name ?? String(m.gymId),
      m.updatedAt?.slice(0, 10) ?? '',
    ]);
    onCsvReady([header, ...rows]);
  }, [machines, isLoading, onCsvReady]);

  useEffect(() => {
    if (!onPdfDataReady || isLoading) return;
    onPdfDataReady(
      {
        gymName: filters.gymName,
        cutDate: fmtDate(filters.range.to),
        genAt,
        kpis: [
          { label: 'Total de máquinas', value: machines.length.toString(),                                               accent: '#6B7280' },
          { label: 'Disponibles',       value: byStatus.find(s => s.key === 'AVAILABLE')?.value.toString()   ?? '0',    accent: '#10B981' },
          { label: 'En uso',            value: byStatus.find(s => s.key === 'IN_USE')?.value.toString()      ?? '0',    accent: '#2563EB' },
          { label: 'En mantenimiento',  value: byStatus.find(s => s.key === 'MAINTENANCE')?.value.toString() ?? '0',    accent: '#EF4444' },
        ],
        maintenance: maintenance.map(m => ({
          name:      m.name,
          category:  CATEGORY_LABELS[m.category] ?? m.category,
          gym:       m.gym?.name ?? '—',
          updatedAt: m.updatedAt?.slice(0, 10) ?? '—',
        })),
        allMachines: machines.map(m => ({
          name:     m.name,
          category: CATEGORY_LABELS[m.category] ?? m.category,
          gym:      m.gym?.name ?? '—',
          status:   STATUS_LABELS[m.status] ?? m.status,
        })),
        charts: {},
      },
      ['chart-maquinas-pie', 'chart-maquinas-bar'],
    );
  }, [machines, isLoading, onPdfDataReady]);

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
      <ReportHeader title="Inventario de Máquinas" gymName={filters.gymName} />
      <ReportMetaStripSingle label="Corte" value={fmtDate(filters.range.to)} genAt={genAt} />

      <div style={{ padding: '28px 40px 40px' }}>
        <ReportKpiGrid kpis={[
          { label: 'Total de máquinas', value: machines.length.toString(),                                               accent: '#6B7280' },
          { label: 'Disponibles',       value: byStatus.find(s => s.key === 'AVAILABLE')?.value.toString()   ?? '0',    accent: '#10B981' },
          { label: 'En uso',            value: byStatus.find(s => s.key === 'IN_USE')?.value.toString()      ?? '0',    accent: '#2563EB' },
          { label: 'En mantenimiento',  value: byStatus.find(s => s.key === 'MAINTENANCE')?.value.toString() ?? '0',    accent: '#EF4444' },
        ]} />

        <AutoInsights insights={insightsMaquinas({ total: machines.length, maintenance: maintenance.length, available: byStatus.find(s => s.key === 'AVAILABLE')?.value ?? 0 })} />

        {/* Pie charts */}
        <ReportSectionTitle>Distribución del Inventario</ReportSectionTitle>
        <div id="chart-maquinas-pie" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
        <ReportSectionTitle>Máquinas por Categoría</ReportSectionTitle>
        <div id="chart-maquinas-bar">
        <BarChart width={820} height={180} data={byCategory} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }} />
          <Bar dataKey="value" name="Máquinas" radius={[3, 3, 0, 0]}>
            {byCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
          </Bar>
        </BarChart>
        </div>

        {/* Maintenance list */}
        {maintenance.length > 0 && (
          <>
            <ReportSectionTitle>Máquinas Pendientes de Mantenimiento</ReportSectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1f2937' }}>
                  {['Máquina', 'Categoría', 'Sucursal', 'Últ. actualización'].map((h, i) => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffffff', fontWeight: 600 }}>
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
        <ReportSectionTitle>Inventario Completo</ReportSectionTitle>
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

        <ReportFooter genAt={genAt} />
      </div>
    </div>
  );
}
