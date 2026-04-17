/**
 * AxiosSedesApiAdapter — Adaptador real de API para sedes.
 * 
 * Implementa ISedesApiService usando Axios para comunicarse con el backend NestJS.
 * Se usará cuando el backend esté disponible.
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
      const response = await this.client.get('/api/v1/sedes', {
        params: {
          lat: params.userLat,
          lng: params.userLng,
          radius: params.radius,
        },
      });

      const sedes = response.data.map((dto: Record<string, unknown>) =>
        SedeDTOMapper.toDomain(dto)
      );

      return right(sedes);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Error al obtener sedes del servidor';
      return left(new Error(message));
    }
  }

  async obtenerSedePorId(id: string): Promise<Either<Error, Sede>> {
    try {
      const response = await this.client.get(`/api/v1/sedes/${id}`);
      const sede = SedeDTOMapper.toDomain(response.data);
      return right(sede);
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : `Error al obtener sede ${id}`;
      return left(new Error(message));
    }
  }
}
