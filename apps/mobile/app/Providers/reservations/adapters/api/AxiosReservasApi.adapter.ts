/**
 * AxiosReservasApiAdapter — Adaptador de persistencia.
 * 
 * Implementa IReservasApiService comunicándose con el cliente Axios real
 * y traduciendo las llamadas a la estructura requerida por el backend relacional NestJS.
 */

import { IReservasApiService, CrearReservaParams, Reserva } from '@gymsync/core';
import { Either, left, right } from '@gymsync/core';
import { reservationApi } from '../../api/reservation.api';
import { AuthService } from '../../../auth/AuthService';
import { Identifier } from '@gymsync/core';

export class AxiosReservasApiAdapter implements IReservasApiService {
  async crearReserva(params: CrearReservaParams): Promise<Either<Error, Reserva>> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user || !user.userId) {
        return left(new Error('Usuario no autenticado en la sesión actual.'));
      }

      const token = await AuthService.getToken();
      if (!token) {
        console.warn('[ERROR AUTH] No hay token en el llavero seguro');
        return left(new Error('No hay sesión activa. Inicia sesión nuevamente.'));
      }

      const gymIdNum = Number(params.gymId);
      const activities = await reservationApi.getGymActivities(gymIdNum);
      
      let resolvedScheduleId: number | null = null;
      let resolvedActivityName = params.actividad;

      // Buscar actividad por nombre (case-insensitive)
      const matchedActivity = activities.find(
        (a) => a.name.toLowerCase() === params.actividad.toLowerCase()
      );

      if (matchedActivity && matchedActivity.schedules && matchedActivity.schedules.length > 0) {
        // Encontrar el horario que empiece en la hora seleccionada
        const targetTime = params.hora.includes(':') && params.hora.split(':').length === 2 ? `${params.hora}:00` : params.hora;
        const matchedSchedule = matchedActivity.schedules.find(
          (s) => s.startTime.startsWith(params.hora) || targetTime.startsWith(s.startTime.substring(0, 5))
        );

        if (matchedSchedule) {
          resolvedScheduleId = matchedSchedule.id;
        } else {
          // Tomar el primer horario disponible de la actividad seleccionada
          resolvedScheduleId = matchedActivity.schedules[0].id;
        }
      }

      // Fallback 
      if (!resolvedScheduleId) {
        // Buscar cualquier horario disponible en las actividades de la sucursal
        for (const act of activities) {
          if (act.schedules && act.schedules.length > 0) {
            resolvedScheduleId = act.schedules[0].id;
            resolvedActivityName = act.name;
            break;
          }
        }
      }

      // Si aún no se pudo resolver, usamos un ID por defecto para cumplir con el contrato relacional
      if (!resolvedScheduleId) {
        resolvedScheduleId = 1; 
      }

      // payload estructurado para el Backend NestJS
      const dateParts = params.fecha.split('T')[0]; //"YYYY-MM-DD"
      
      const payload = {
        userId: Number(user.userId),
        gymActivityScheduleId: resolvedScheduleId,
        reservationDate: dateParts,
      };

      // payload ready

      const response = await reservationApi.createReservation(payload);

      // success

      //Traducir de vuelta a la entidad Reserva de dominio
      const reserva = Reserva.create({
        id: Identifier.create(response.id),
        userId: user.userId,
        gymId: params.gymId,
        activityId: String(resolvedScheduleId),
        scheduleId: String(resolvedScheduleId),
        activityName: resolvedActivityName,
        fecha: new Date(response.reservationDate),
        horaInicio: params.hora,
        horaFin: params.hora,
        estado: response.status === 'CONFIRMADA' || response.status === 'CONFIRMED' ? 'CONFIRMADA' : 'PENDIENTE',
        createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      });

      return right(reserva);

    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error al persistir la reserva en el backend.';
      console.warn('[AxiosReservasApiAdapter] Error:', errorMsg);
      return left(new Error(errorMsg));
    }
  }
}
