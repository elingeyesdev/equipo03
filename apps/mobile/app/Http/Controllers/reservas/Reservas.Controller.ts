/**
 * Reservas.Controller.ts — Controlador del módulo de reservas (Zustand + Hook).
 * 
 * Gestiona el estado de obtención de detalles operacionales, aforo, horarios de la sucursal
 * y actividades disponibles inyectando los casos de uso correspondientes del Core.
 */

import { create } from 'zustand';
import { 
  ObtenerDetallesSucursalReservaUseCase, 
  DetalleSucursalReservaResponse, 
  CrearReservaUseCase, 
  Reserva 
} from '@gymsync/core';
import { Either, left } from '@gymsync/core';
import { AuthService } from '../../../Providers/auth/AuthService';

interface ReservasState {
  gymId: string | null;
  detalleSucursal: DetalleSucursalReservaResponse | null;
  loading: boolean;
  error: string | null;

  setGymId: (gymId: string | null) => void;
  setDetalleSucursal: (detalle: DetalleSucursalReservaResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useReservasStore = create<ReservasState>((set) => ({
  gymId: null,
  detalleSucursal: null,
  loading: false,
  error: null,

  setGymId: (gymId) => set({ gymId }),
  setDetalleSucursal: (detalleSucursal) => set({ detalleSucursal }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    gymId: null,
    detalleSucursal: null,
    loading: false,
    error: null,
  }),
}));

/**
 * ReservasController — Bridge entre la vista y los casos de uso del Core.
 */
export const ReservasController = (
  obtenerDetallesUseCase: ObtenerDetallesSucursalReservaUseCase,
  crearReservaUseCase: CrearReservaUseCase
) => {
  const store = useReservasStore();

  /**
   * Carga los detalles operacionales y servicios validados de la sucursal seleccionada.
   */
  const cargarDetallesSucursal = async (gymId: string) => {
    // Evitar llamadas duplicadas o condiciones de carrera si ya se está cargando o ya está cargado el mismo gymId
    if (useReservasStore.getState().loading && useReservasStore.getState().gymId === gymId) {
      return;
    }

    store.reset();
    store.setGymId(gymId);
    store.setLoading(true);
    store.setError(null);

    try {
      const result = await obtenerDetallesUseCase.execute({ gymId });

      if (result.isRight()) {
        store.setDetalleSucursal(result.value);
      } else {
        store.setError(result.value.message || 'Error desconocido al cargar sucursal.');
      }
    } catch (err: any) {
      store.setError(err?.message || 'Error de conexión.');
    } finally {
      store.setLoading(false);
    }
  };

  /**
   * Procesa la creación y persistencia defensiva de una nueva reserva.
   */
  const confirmarNuevaReserva = async (params: {
    gymId: string;
    fecha: Date;
    hora: string;
    actividad: string;
  }): Promise<Either<Error, Reserva>> => {
    store.setLoading(true);
    store.setError(null);

    try {
      const currentUser = await AuthService.getCurrentUser();
      const token       = await AuthService.getToken();
      const userId      = currentUser?.userId || '';

      if (!userId || !token) {
        console.warn('[AUTH] No hay token. confirmarNuevaReserva bloqueado.');
        const authErr = new Error('No hay sesión activa. Inicia sesión nuevamente.');
        store.setError(authErr.message);
        return left(authErr);
      }

      const result = await crearReservaUseCase.execute({
        gymId: params.gymId,
        fecha: params.fecha,
        hora: params.hora,
        actividad: params.actividad,
        userId: String(userId),
      });

      if (result.isRight()) {
        store.reset();
        return result;
      } else {
        store.setError(result.value.message);
        return result;
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error de conexión al guardar reserva.';
      store.setError(errorMsg);
      return left(new Error(errorMsg));
    } finally {
      store.setLoading(false);
    }
  };

  return {
    ...store,
    cargarDetallesSucursal,
    confirmarNuevaReserva,
  };
};
