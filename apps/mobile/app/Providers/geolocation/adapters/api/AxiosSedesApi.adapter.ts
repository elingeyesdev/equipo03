/**
 * AxiosSedesApiAdapter — Adaptador real de API para sedes.
 * 
 * Implementa ISedesApiService usando Axios para comunicarse con el backend NestJS.
 * Se usará cuando el backend esté disponible.
 * 
 * NOTA: El interceptor de sedes.api.config.ts desempaqueta automáticamente
 * el envelope { success, data }, por lo que aquí recibimos directamente los datos.
 */

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
      console.log('[AxiosSedesApiAdapter] Obteniendo sedes con params:', params);
      
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
        console.error('[AxiosSedesApiAdapter] Respuesta no es un array:', payload);
        return left(new Error('Formato de respuesta inválido'));
      }

      const sedes = payload.map((dto: Record<string, unknown>) =>
        SedeDTOMapper.toDomain(dto)
      );

      console.log('[AxiosSedesApiAdapter] Sedes obtenidas:', sedes.length);
      return right(sedes);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error al obtener sedes del servidor';
      console.error('[AxiosSedesApiAdapter] Error:', message);
      return left(new Error(message));
    }
  }

  async obtenerSedePorId(id: string): Promise<Either<Error, Sede>> {
    try {
      console.log('[AxiosSedesApiAdapter] Iniciando consulta unificada de sede e id:', id);
      
      // Consultas en paralelo para gimnasio y sus actividades reales
      const gymIdParam = Number(id);
      const [gymResponse, activitiesResponse] = await Promise.all([
        this.client.get(`/api/gyms/${id}`),
        this.client.get('/api/activities', { params: { gym_id: gymIdParam } })
          .catch((err) => {
            console.warn('[AxiosSedesApiAdapter] Error al cargar actividades en obtenerSedePorId:', err?.message);
            return { data: { data: [] } };
          })
      ]);
      
      const gymDataCruda = gymResponse.data.data;
      const actividadesCrudas = activitiesResponse.data.data;
      
      // INYECCIÓN DE LOGS DE DIAGNÓSTICO (PASO 3)
      console.log('[DEBUG DIAGNÓSTICO] OBJETO CRUDO DE GIMNASIO (gymResponse.data):', gymResponse.data);
      console.log('[DEBUG DIAGNÓSTICO] OBJETO CRUDO DE ACTIVIDADES (activitiesResponse.data):', activitiesResponse.data);
      console.log('[DEBUG DIAGNÓSTICO] gymDataCruda EXTRAÍDO:', gymDataCruda);
      console.log('[DEBUG DIAGNÓSTICO] actividadesCrudas EXTRAÍDAS:', actividadesCrudas);
      
      // Sintetizar horarios operativos estándar por defecto si el backend no los provee planos
      const defaultSchedules = [
        { dayOfWeek: 1, opensAt: '06:00:00', closesAt: '22:00:00' }, // Lunes
        { dayOfWeek: 2, opensAt: '06:00:00', closesAt: '22:00:00' }, // Martes
        { dayOfWeek: 3, opensAt: '06:00:00', closesAt: '22:00:00' }, // Miércoles
        { dayOfWeek: 4, opensAt: '06:00:00', closesAt: '22:00:00' }, // Jueves
        { dayOfWeek: 5, opensAt: '06:00:00', closesAt: '22:00:00' }, // Viernes
        { dayOfWeek: 6, opensAt: '08:00:00', closesAt: '20:00:00' }, // Sábado
        { dayOfWeek: 0, opensAt: '09:00:00', closesAt: '14:00:00' }, // Domingo
      ];

      const schedules = gymDataCruda.schedules && gymDataCruda.schedules.length > 0
        ? gymDataCruda.schedules
        : defaultSchedules;

      const combinedPayload = {
        ...gymDataCruda,
        schedules,
        servicios: actividadesCrudas,
        services: actividadesCrudas,
        activities: actividadesCrudas,
        gym_activities: actividadesCrudas,
        gym_activity: actividadesCrudas,
      };

      console.log('[DEBUG DIAGNÓSTICO] OBJETO COMBINADO ENVIADO AL MAPPER:', combinedPayload);
      console.log('[AxiosSedesApiAdapter] Payload unificado combinado con éxito:', combinedPayload);
      
      const sede = SedeDTOMapper.toDomain(combinedPayload);
      console.log('[AxiosSedesApiAdapter] Sede de dominio generada correctamente con actividades:', sede.servicios);
      
      return right(sede);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : `Error al obtener sede ${id}`;
      console.error('[AxiosSedesApiAdapter] Error unificado en obtenerSedePorId:', message);
      return left(new Error(message));
    }
  }
}
