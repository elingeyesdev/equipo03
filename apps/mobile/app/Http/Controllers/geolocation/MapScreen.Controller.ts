/**
 * MapScreenController — Estado + acciones para la pantalla del mapa.
 * 
 * Usa Zustand para state management reactivo.
 * Encapsula toda la lógica de estado del mapa.
 */

import { create } from 'zustand';
import { Sede } from '@gymsync/core';
import { Coordenadas } from '@gymsync/core';
import { SedeConDistancia, ObtenerSedesCercanasUseCase } from '@gymsync/core';
import { CalcularRutaUseCase } from '@gymsync/core';
import { FiltrarSedesUseCase, FiltrosCatalogo } from '@gymsync/core';

interface MapScreenState {
  // Estado
  userLocation: Coordenadas | null;
  sedesConDistancia: SedeConDistancia[];
  selectedSede: Sede | null;
  loading: boolean;
  error: string | null;
  radioKm: number;
  isListView: boolean;
  filtros: FiltrosCatalogo;

  // Acciones
  setUserLocation: (location: Coordenadas) => void;
  setSedesConDistancia: (sedes: SedeConDistancia[]) => void;
  seleccionarSede: (sede: Sede) => void;
  cerrarModalSede: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRadioKm: (radio: number) => void;
  toggleListView: () => void;
  setFiltros: (nuevosFiltros: Partial<FiltrosCatalogo>) => void;
  reset: () => void;
}

export const useMapScreenStore = create<MapScreenState>((set) => ({
  // Estado inicial
  userLocation: null,
  sedesConDistancia: [],
  selectedSede: null,
  loading: false,
  error: null,
  radioKm: 10,
  isListView: false,
  filtros: {},

  // Acciones
  setUserLocation: (location) => set({ userLocation: location }),
  setSedesConDistancia: (sedes) => set({ sedesConDistancia: sedes }),
  seleccionarSede: (sede) => set({ selectedSede: sede }),
  cerrarModalSede: () => set({ selectedSede: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setRadioKm: (radio) => set({ radioKm: radio }),
  toggleListView: () => set((state) => ({ isListView: !state.isListView })),
  setFiltros: (nuevos) => set((state) => ({ filtros: { ...state.filtros, ...nuevos } })),
  reset: () => set({
    userLocation: null,
    sedesConDistancia: [],
    selectedSede: null,
    loading: false,
    error: null,
    isListView: false,
    filtros: {},
  }),
}));

/**
 * Hook que conecta el store con los casos de uso.
 */
export const MapScreenController = (
  obtenerSedesUseCase: ObtenerSedesCercanasUseCase,
  calcularRutaUseCase: CalcularRutaUseCase,
  filtrarSedesUseCase: FiltrarSedesUseCase,
) => {
  const store = useMapScreenStore();

  const cargarSedesCercanas = async () => {
    store.setLoading(true);
    store.setError(null);

    const result = await obtenerSedesUseCase.execute({
      radioKm: store.radioKm,
    });

    if (result.isRight()) {
      const sedes = result.value;
      store.setSedesConDistancia(sedes);

      // Extraer ubicación del usuario del primer resultado si existe
      // (la ubicación se obtuvo internamente en el use case)
    } else {
      store.setError(result.value.mensajeUsuario ?? result.value.message);
    }

    store.setLoading(false);
  };

  const comoLlegar = async (sede: Sede) => {
    try {
      await calcularRutaUseCase.execute(store.userLocation, sede);
    } catch (err) {
      console.error('Error al abrir navegación:', err);
    }
  };

  const reintentarCarga = () => {
    cargarSedesCercanas();
  };

  // Computado: Sedes destiladas a traves de los filtros
  const sedesObj = store.sedesConDistancia.map(s => s.sede);
  const sedesFiltradasObj = filtrarSedesUseCase.execute(sedesObj, store.filtros);
  const sedesFiltradas = store.sedesConDistancia.filter(s => 
    sedesFiltradasObj.some((filtrada: Sede) => filtrada.id.value === s.sede.id.value)
  );

  return {
    ...store,
    sedesFiltradas,
    cargarSedesCercanas,
    comoLlegar,
    reintentarCarga,
  };
};
