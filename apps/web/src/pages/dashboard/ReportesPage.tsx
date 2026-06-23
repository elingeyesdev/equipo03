import React, { useState } from 'react';
import { FileText, BarChart2, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ReportFilterModal }  from '../../components/Reports/ReportFilterModal';
import { ReportPreviewModal } from '../../components/Reports/ReportPreviewModal';
import type { ReportType, ReportFilters } from '../../components/Reports/types';

interface ReportCard {
  type:        ReportType;
  title:       string;
  description: string;
  badge:       string;
  icon:        React.ReactNode;
  superOnly?:  boolean;
}

const CARDS: ReportCard[] = [
  {
    type:        'asistencia',
    title:       'Asistencia por Sucursal',
    description: '¿Cuántos miembros asistieron y en qué horarios? Muestra los días con más afluencia, horas pico y una comparativa con el mes anterior.',
    badge:       'GERENTE',
    icon:        <BarChart2 size={22} />,
  },
  {
    type:        'maquinas',
    title:       'Inventario de Máquinas',
    description: 'Estado actual de cada equipo por categoría. Identifica de un vistazo cuáles están disponibles y cuáles requieren mantenimiento.',
    badge:       'GERENTE / SUPER ADMIN',
    icon:        <Layers size={22} />,
  },
  {
    type:        'consolidado',
    title:       'Consolidado de Sucursales',
    description: 'Visión global de toda la red: compara asistencias, reservas, miembros activos y equipos en cada sucursal, agrupados por marca.',
    badge:       'SUPER ADMIN',
    icon:        <FileText size={22} />,
    superOnly:   true,
  },
];

export function ReportesPage() {
  const { user } = useAuth();
  const isSuperAdmin = (user?.level ?? 0) >= 10;

  const [filterType,  setFilterType]  = useState<ReportType | null>(null);
  const [activeFilters, setActiveFilters] = useState<ReportFilters | null>(null);

  function openFilter(type: ReportType) {
    setActiveFilters(null);
    setFilterType(type);
  }

  function handleFilterConfirm(filters: ReportFilters) {
    setFilterType(null);
    setActiveFilters(filters);
  }

  function closePreview() {
    setActiveFilters(null);
  }

  const visibleCards = CARDS.filter(c => !c.superOnly || isSuperAdmin);

  return (
    <div className="min-h-full p-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Reportes</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Genera y exporta informes PDF basados en los datos de tu sucursal.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map(card => (
          <div
            key={card.type}
            className="flex flex-col rounded-xl border border-slate-200 dark:border-[#3A3A3C] bg-white dark:bg-bg-surface p-5 transition-colors hover:border-[#FF5E00]/60 dark:hover:border-[#FF5E00]/40 shadow-sm dark:shadow-none"
          >
            {/* Icon + badge row */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5E00]/10 text-[#FF5E00]">
                {card.icon}
              </div>
              <span className="rounded-full border border-slate-200 dark:border-[#3A3A3C] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                {card.badge}
              </span>
            </div>

            {/* Text */}
            <h2 className="mb-2 text-[15px] font-semibold text-slate-900 dark:text-white leading-snug">
              {card.title}
            </h2>
            <p className="flex-1 text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
              {card.description}
            </p>

            {/* CTA */}
            <button
              onClick={() => openFilter(card.type)}
              className="mt-5 w-full rounded-lg border border-[#FF5E00]/60 px-4 py-2.5 text-sm font-semibold text-[#FF5E00] transition-colors hover:bg-[#FF5E00]/10"
            >
              Configurar Reporte
            </button>
          </div>
        ))}
      </div>

      {/* Filter modal */}
      {filterType && (
        <ReportFilterModal
          type={filterType}
          onConfirm={handleFilterConfirm}
          onClose={() => setFilterType(null)}
        />
      )}

      {/* Preview modal */}
      {activeFilters && (
        <ReportPreviewModal
          filters={activeFilters}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
