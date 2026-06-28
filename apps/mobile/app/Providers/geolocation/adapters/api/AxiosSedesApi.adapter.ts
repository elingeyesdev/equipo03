import { AxiosInstance } from 'axios';
import { ISedesApiService, SedesQueryParams } from '@gymsync/core';
import { Either, left, right } from '@gymsync/core';
import { Sede } from '@gymsync/core';
import { SedeDTOMapper } from '../../persistence/mappers/SedeDTO-to-SedeEntity.mapper';
import { createSedesApiClient } from './sedes.api.config';

export class AxiosSedesApiAdapter implements ISedesApiService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = createSedesApiClient();
  }

  async obtenerSedes(params: SedesQueryParams): Promise<Either<Error, Sede[]>> {
    try {
      const response = await this.client.get('/api/gyms', {
        params: {
          lat: params.userLat,
          lng: params.userLng,
          radius: params.radius,
        },
      });

      // El interceptor de sedes.api.config.ts desempaqueta el envelope automáticamente
      // Por lo tanto response.data ya contiene el array de sedes directamente
      const payload = response.data;

      if (!Array.isArray(payload)) {
        console.warn('[AxiosSedesApiAdapter] Respuesta no es un array:', payload);
        return left(new Error('Formato de respuesta inválido'));
      }

      const sedes = payload.map((dto: Record<string, unknown>) =>
        SedeDTOMapper.toDomain(dto)
      );

      return right(sedes);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error al obtener sedes del servidor';
      console.warn('[AxiosSedesApiAdapter] Error:', message);
      return left(new Error(message));
    }
  }

  async obtenerSedePorId(id: string): Promise<Either<Error, Sede>> {
    try {
      // Consultas en paralelo para gimnasio y sus actividades reales
      const gymIdParam = Number(id);
      const [gymResponse, activitiesResponse] = await Promise.all([
        this.client.get(`/api/gyms/${id}`),
        this.client.get('/api/activities', { params: { gymId: gymIdParam } })
          .catch((err) => {
            console.warn('[AxiosSedesApiAdapter] Error al cargar actividades en obtenerSedePorId:', err?.message);
            return { data: [] };
          })
      ]);

      // El interceptor ya desempaqueta el envelope: response.data ES el payload final
      const gymDataCruda = gymResponse.data;
      const rawActividades = activitiesResponse.data;
      const actividadesCrudas = Array.isArray(rawActividades) ? rawActividades : (rawActividades?.data ?? []);
      
      const DOW_MAP: Record<string, number> = { DOM:0, LUN:1, MAR:2, MIE:3, JUE:4, VIE:5, SAB:6 };
      const dayTimes: Record<number, { min: string; max: string }> = {};
      actividadesCrudas.forEach((act: any) => {
        (act.schedules ?? []).forEach((sch: any) => {
          const idx = DOW_MAP[sch.dayOfWeek];
          if (idx === undefined) return;
          const s = String(sch.startTime ?? '06:00').substring(0, 5);
          const e = String(sch.endTime   ?? '22:00').substring(0, 5);
          if (!dayTimes[idx]) dayTimes[idx] = { min: s, max: e };
          else {
            if (s < dayTimes[idx].min) dayTimes[idx].min = s;
            if (e > dayTimes[idx].max) dayTimes[idx].max = e;
          }
        });
      });
      const derivedSchedules = Object.entries(dayTimes).map(([d, t]) => ({
        dayOfWeek: Number(d), opensAt: t.min, closesAt: t.max,
      }));

      const schedules =
        (gymDataCruda.gymSchedules?.length > 0 ? gymDataCruda.gymSchedules : null) ??
        (gymDataCruda.schedules?.length    > 0 ? gymDataCruda.schedules    : null) ??
        (derivedSchedules.length           > 0 ? derivedSchedules          : []);

      const combinedPayload = {
        ...gymDataCruda,
        schedules,
        servicios: actividadesCrudas,
        services: actividadesCrudas,
        activities: actividadesCrudas,
        gym_activities: actividadesCrudas,
        gym_activity: actividadesCrudas,
      };

      const sede = SedeDTOMapper.toDomain(combinedPayload);
      return right(sede);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : `Error al obtener sede ${id}`;
      console.warn('[AxiosSedesApiAdapter] Error unificado en obtenerSedePorId:', message);
      return left(new Error(message));
    }
  }
}
