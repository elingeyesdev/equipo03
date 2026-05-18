/**
 * AxiosGymsApi.adapter.ts — Implementación concreta de IGymsApiService para la web.
 *
 * Provee los datos crudos de `/gyms` para el caso de uso ObtenerSedesMapaUseCase.
 * El endpoint /gyms devuelve tanto sedes principales como sucursales en la misma
 * respuesta; la separación es responsabilidad del Core.
 */
import { apiClient } from './api.config';
import type { IGymsApiService, IGymRaw } from '@gymsync/core';

export class AxiosGymsApiAdapter implements IGymsApiService {
  async findAll(): Promise<IGymRaw[]> {
    const response = await apiClient.get('/gyms');
    return Array.isArray(response.data) ? response.data : [];
  }
}

/** Instancia singleton reutilizable. */
export const gymsApiAdapter = new AxiosGymsApiAdapter();
