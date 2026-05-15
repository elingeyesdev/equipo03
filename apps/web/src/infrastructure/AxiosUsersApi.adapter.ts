/**
 * AxiosUsersApi.adapter.ts — Implementación concreta de IUsersApiService para la web.
 *
 * Errores mapeados:
 *   - HTTP 403 → GymScopeViolationException (excepción de dominio del Core)
 *   - Otros errores → re-lanzados tal cual para el interceptor global de Axios
 */
import { apiClient } from './api.config';
import type { IUsersApiService, IUserRecord } from '@gymsync/core';
import { GymScopeViolationException } from '@gymsync/core';

export class AxiosUsersApiAdapter implements IUsersApiService {
  async findAll(): Promise<IUserRecord[]> {
    try {
      const [usersRes, gymsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/gyms'),
      ]);

      const gymsMap = new Map<number, string>(
        Array.isArray(gymsRes.data)
          ? gymsRes.data.map((g: any) => [Number(g.id), String(g.name)])
          : []
      );

      const users: IUserRecord[] = Array.isArray(usersRes.data) ? usersRes.data : [];
      return users.map((u: any) => ({ ...u, gymsMap }));
    } catch (error: any) {
      // Mapeo de 403 → excepción de dominio del Core
      if (error?.response?.status === 403) {
        throw new GymScopeViolationException(
          error?.response?.data?.message || 'Acceso denegado: operación fuera del scope de tu sede.'
        );
      }
      throw error;
    }
  }
}

/** Instancia singleton reutilizable. */
export const usersApiAdapter = new AxiosUsersApiAdapter();
