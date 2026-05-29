import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { AuthService } from '../../auth/AuthService';

export interface VisitPayload {
  gymId: number;
  enteredAt: string;
  exitedAt?: string;
  durationMin?: number;
}

export interface VisitRecord {
  id: number;
  gymId: number;
  enteredAt: string;
  exitedAt?: string;
  durationMin?: number;
  createdAt: string;
  gym?: {
    id: number;
    name: string;
    location?: { address?: string };
  };
}

const visitsClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

visitsClient.interceptors.request.use(async (config) => {
  const token = await AuthService.getToken();
  if (!token) return Promise.reject(new Error('Sin sesión activa'));
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const visitsApi = {
  postVisit: async (payload: VisitPayload): Promise<VisitRecord> => {
    const res = await visitsClient.post('/api/visits', payload);
    return res.data?.data ?? res.data;
  },

  getMyVisits: async (): Promise<VisitRecord[]> => {
    const res = await visitsClient.get('/api/visits/me');
    const raw = res.data?.data ?? res.data;
    return Array.isArray(raw) ? raw : [];
  },
};
