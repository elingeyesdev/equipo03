import axios from 'axios';
import { AuthService } from '../auth/AuthService';
import { Env } from '../geolocation/config/environment';
import { attach401Guard } from '../auth/axios401Guard';
import { attachOfflineInterceptor } from '../offline/offlineInterceptor';

export interface MachineItem {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
  category: 'CARDIO' | 'TREN_SUPERIOR' | 'TREN_INFERIOR' | 'ESPALDA' | 'MULTIESTACION';
  imageUrl?: string | null;
  gymId: number;
}

const machinesClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

machinesClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (raw) config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(machinesClient);
attachOfflineInterceptor(machinesClient);

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const machinesApi = {
  getByGymAndStatus: async (
    gymId: number,
    status: 'AVAILABLE' | 'MAINTENANCE',
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<MachineItem>> => {
    const response = await machinesClient.get('/api/machines', {
      params: { gymId, status, ...params },
    });
    const rawData = response.data;
    const all: any[] = Array.isArray(rawData.data) ? rawData.data : [];

    return {
      data: all
        .map((item): MachineItem => ({
          id:       String(item.id),
          name:     item.name,
          category: item.category,
          status:   item.status,
          imageUrl: item.image_url ?? item.imageUrl ?? null,
          gymId:    item.gym_id   ?? item.gymId,
        }))
        .filter((m) => m.gymId === gymId && m.status === status),
      meta: rawData.meta,
    };
  },
};
