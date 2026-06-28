import { 
  ObtenerDetallesSucursalReservaUseCase, 
  CrearReservaUseCase 
} from '@gymsync/core';
import { AxiosSedesApiAdapter } from './geolocation/adapters/api/AxiosSedesApi.adapter';
import { AxiosReservasApiAdapter } from './reservations/adapters/api/AxiosReservasApi.adapter';
import { ReservasController } from '../Http/Controllers/reservas/Reservas.Controller';

export const ReservationsModule = {
  provideObtenerDetallesUseCase: () => {
    const sedesApiAdapter = new AxiosSedesApiAdapter();
    return new ObtenerDetallesSucursalReservaUseCase(sedesApiAdapter);
  },

  provideCrearReservaUseCase: () => {
    const reservasApiAdapter = new AxiosReservasApiAdapter();
    return new CrearReservaUseCase(reservasApiAdapter);
  },

  /**
   * Retorna el controlador listo para usar inyectándole sus casos de uso del Core.
   * 
   * Uso en Vistas React:
   *   const controller = ReservationsModule.useController();
   */
  useController: () => {
    const obtenerDetallesUseCase = ReservationsModule.provideObtenerDetallesUseCase();
    const crearReservaUseCase = ReservationsModule.provideCrearReservaUseCase();
    return ReservasController(obtenerDetallesUseCase, crearReservaUseCase);
  }
};
