import { apiClient } from './api.config';
import type { IAuthApiService, RegistrarClienteDTO } from '@gymsync/core';

export class AxiosAuthApiAdapter implements IAuthApiService {
  async registrarCliente(dto: RegistrarClienteDTO): Promise<void> {
    try {
      // Mapear 'name' a 'firstName' y 'lastName', y omitir 'phone' según el contrato exacto del backend NestJS
      const parts = (dto.name || '').trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '-';

      const payload = {
        firstName,
        lastName,
        email: (dto.email || '').trim().toLowerCase(),
        password: dto.password,
      };

      // Enviamos el payload al endpoint público de registro.
      // Usamos _skipErrorToast: true para evitar el toast automático global y pintar el error en el formulario de la UI.
      await apiClient.post('/auth/register', payload, {
        _skipErrorToast: true,
      } as any);
    } catch (error: any) {
      if (error.response) {
        const body = error.response.data;
        const status = error.response.status;
        
        // Mapear errores de validación HTTP 400 de NestJS
        if (status === 400 && body) {
          const rawMessage = body.message || 'Error de validación del servidor';
          if (Array.isArray(rawMessage)) {
            throw new Error(rawMessage.join('\n• '));
          }
          throw new Error(String(rawMessage));
        }
        
        // Mapear otros errores del servidor (ej: 409 conflicto, 500, etc.)
        const rawMessage = body?.message || body?.error || error.message || 'Error en el servidor';
        throw new Error(String(rawMessage));
      }
      throw new Error(error.message || 'Error de red o conexión perdida.');
    }
  }
}

export const authApiAdapter = new AxiosAuthApiAdapter();
