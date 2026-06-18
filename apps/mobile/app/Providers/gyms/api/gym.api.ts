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
import { attachOfflineInterceptor } from '../../offline/offlineInterceptor';
attachOfflineInterceptor(gymClient);

export type DashboardStats = {
  occupancy:   number;
  capacity:    number;
  totalToday:  number;
  completed:   number;
  pending:     number;
};

export type OccupancyBreakdown = { date: string; count: number };

export type OccupancyStats = {
  gymId: number;
  gymName: string;
  period: 'day' | 'week' | 'month' | 'year';
  since: string;
  completedReservations: number;
  maxCapacity: number;
  occupancyPct?: number;
  breakdown: OccupancyBreakdown[];
};

export const gymApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await gymClient.get('/api/gyms/me/dashboard-stats');
    return response.data?.data ?? response.data;
  },

  getOccupancy: async (
    gymId: number,
    period: 'day' | 'week' | 'month' | 'year' = 'day',
  ): Promise<OccupancyStats> => {
    const response = await gymClient.get(`/api/gyms/${gymId}/occupancy`, { params: { period } });
    return response.data?.data ?? response.data;
  },
};
