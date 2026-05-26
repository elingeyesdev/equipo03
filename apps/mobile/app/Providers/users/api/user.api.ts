/**
 * Cliente Axios para el Módulo de Usuarios
 */
import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { AuthService } from '../../auth/AuthService';
import { attach401Guard } from '../../auth/axios401Guard';

const userClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Inyectar JWT ──────────────────────────────────────────────────────────────
userClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(userClient);

export const userApi = {
  /**
   * PATCH /api/users/me/push-token
   * Guarda el Expo Push Token del usuario autenticado en el backend.
   */
  updatePushToken: async (token: string): Promise<{ success: boolean }> => {
    const response = await userClient.patch('/api/users/me/push-token', { token });
    return response.data?.data ?? response.data;
  },
};
