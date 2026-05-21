/**
 * CrearReservaUseCase — Caso de uso.
 * 
 * Orquesta la validación defensiva de la reserva en el dominio y la persistencia
 * contra el backend externo NestJS.
 */

import { Either, left } from '../../../shared/kernel/Either';
import { Reserva } from '../../../domain/entities/Reserva.entity';
import { Identifier } from '../../../shared/kernel/Identifier';
import { IReservasApiService } from '../output/IReservasApiService.port';

export type CrearReservaRequest = {
  gymId: string;
  fecha: Date;
  hora: string;       // Formato HH:mm
  actividad: string;  // Nombre de la actividad seleccionada
  userId: string;
};

export class CrearReservaUseCase {
  constructor(
    private readonly reservasApiService: IReservasApiService,
  ) {}

  async execute(
    request: CrearReservaRequest
  ): Promise<Either<Error, Reserva>> {
    try {
      if (!request.gymId) return left(new Error('El ID de sucursal es obligatorio'));
      if (!request.fecha) return left(new Error('La fecha de la reserva es obligatoria'));
      if (!request.hora) return left(new Error('La hora de la reserva es obligatoria'));
      if (!request.actividad) return left(new Error('La actividad seleccionada es obligatoria'));
      if (!request.userId) return left(new Error('El ID de usuario es obligatorio'));

      // 1. Instanciación y validación defensiva en el dominio
      // La reserva debe nacer estrictamente con un estado válido de nacimiento ('PENDIENTE' o 'CONFIRMADA')
      const reservaDominio = Reserva.create({
        id: Identifier.create(Math.random().toString(36).substring(2, 11)), // ID temporal de cliente
        userId: request.userId,
        gymId: request.gymId,
        activityId: request.actividad,
        scheduleId: request.hora,
        activityName: request.actividad,
        fecha: request.fecha,
        horaInicio: request.hora,
        horaFin: request.hora,
        estado: 'CONFIRMADA', // Nace confirmada/válida
      });

      // Doble chequeo defensivo del estado inicial de nacimiento
      if (reservaDominio.estado !== 'PENDIENTE' && reservaDominio.estado !== 'CONFIRMADA') {
        return left(new Error('El estado inicial de nacimiento de la reserva debe ser PENDIENTE o CONFIRMADA.'));
      }

      // 2. Persistencia y propagación en infraestructura remota
      return await this.reservasApiService.crearReserva({
        gymId: request.gymId,
        fecha: request.fecha.toISOString(),
        hora: request.hora,
        actividad: request.actividad,
      });

    } catch (error: any) {
      return left(new Error(error?.message || 'Error al validar o procesar la reserva.'));
    }
  }
}
