/**
 * IReservasApiService — Puerto de salida.
 * 
 * Define el contrato de comunicación para persistencia y creación de reservas
 * contra el backend externo NestJS.
 */

import { Either } from '../../../shared/kernel/Either';
import { Reserva } from '../../../domain/entities/Reserva.entity';

export interface CrearReservaParams {
  gymId: string;
  fecha: string;      // Formato ISO string (ej. "2026-05-19T00:00:00.000Z")
  hora: string;       // Formato HH:mm (ej. "14:30")
  actividad: string;  // Nombre o ID de la actividad (ej. "Musculación")
}

export interface IReservasApiService {
  crearReserva(params: CrearReservaParams): Promise<Either<Error, Reserva>>;
}
