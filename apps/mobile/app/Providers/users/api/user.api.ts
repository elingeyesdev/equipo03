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
import { attachOfflineInterceptor } from '../../offline/offlineInterceptor';
attachOfflineInterceptor(userClient);

export const userApi = {
  updatePushToken: async (token: string): Promise<{ registered: boolean }> => {
    const response = await userClient.patch('/api/users/me/push-token', { token });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`PATCH push-token respondió ${response.status}`);
    }
    const root = response.data ?? {};
    const payload = root.data ?? root;
    const registered =
      payload?.registered === true || root.success === true;
    return { registered };
  },

  clearPushToken: async (): Promise<void> => {
    await userClient.delete('/api/users/me/push-token');
  },
};
