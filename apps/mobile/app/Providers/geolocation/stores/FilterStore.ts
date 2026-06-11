import { create } from 'zustand';
import { FiltrosCatalogo, ServicioSede } from '@gymsync/core';

interface FilterState {
  filtros: FiltrosCatalogo;
  setFiltros: (nuevosFiltros: Partial<FiltrosCatalogo>) => void;
  resetFiltros: () => void;
  toggleServicio: (servicio: string) => void;
  toggleBeneficio: (beneficio: string) => void;
  toggleMarca: (marca: string) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  filtros: {},
  setFiltros: (nuevos) => set((state) => ({ filtros: { ...state.filtros, ...nuevos } })),
  resetFiltros: () => set({ filtros: {} }),
  toggleServicio: (servicio) => {
    const { filtros } = get();
    const serviciosActuales = filtros.servicios || [];
    let nuevosServicios = [...serviciosActuales];

    if (nuevosServicios.includes(servicio as ServicioSede)) {
      nuevosServicios = nuevosServicios.filter(s => s !== servicio);
    } else {
      nuevosServicios.push(servicio as ServicioSede);
    }

    set({ filtros: { ...filtros, servicios: nuevosServicios } });
  },
  toggleBeneficio: (beneficio) => {
    const { filtros } = get();
    const beneficiosActuales = filtros.beneficios || [];
    let nuevosBeneficios = [...beneficiosActuales];

    if (nuevosBeneficios.includes(beneficio as any)) {
      nuevosBeneficios = nuevosBeneficios.filter(b => b !== beneficio);
    } else {
      nuevosBeneficios.push(beneficio as any);
    }

    set({ filtros: { ...filtros, beneficios: nuevosBeneficios } });
  },
  toggleMarca: (marca) => {
    const { filtros } = get();
    const marcasActuales = filtros.marcas || [];
    const existe = marcasActuales.includes(marca);
    set({
      filtros: {
        ...filtros,
        marcas: existe
          ? marcasActuales.filter(m => m !== marca)
          : [...marcasActuales, marca],
      },
    });
  },
}));
