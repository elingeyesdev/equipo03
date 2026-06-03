import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { AuthService } from '../../auth/AuthService';
import { attach401Guard } from '../../auth/axios401Guard';

const gymClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

gymClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(gymClient);

export type DashboardStats = {
  occupancy:   number;
  capacity:    number;
  totalToday:  number;
  completed:   number;
  pending:     number;
};

export const gymApi = {
  /**
   * GET /api/gyms/me/dashboard-stats
   * Estadísticas operativas de la sucursal del gerente autenticado.
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await gymClient.get('/api/gyms/me/dashboard-stats');
    return response.data?.data ?? response.data;
  },
};
