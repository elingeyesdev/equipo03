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
      console.log('[AxiosSedesApiAdapter] Obteniendo sede con id:', id);
      
      const response = await this.client.get(`/api/gyms/${id}`);
      
      // El interceptor desempaqueta automáticamente
      const payload = response.data;
      
      const sede = SedeDTOMapper.toDomain(payload);
      console.log('[AxiosSedesApiAdapter] Sede obtenida:', sede);
      
      return right(sede);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : `Error al obtener sede ${id}`;
      console.error('[AxiosSedesApiAdapter] Error:', message);
      return left(new Error(message));
    }
  }
}
