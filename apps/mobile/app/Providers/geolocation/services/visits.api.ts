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
    const visits: VisitRecord[] = Array.isArray(raw) ? raw : [];

    // Si el backend no popula gym.name, lo buscamos por ID para cada gymId único
    const sinNombre = visits.filter(v => !v.gym?.name);
    if (sinNombre.length === 0) return visits;

    const uniqueIds = [...new Set(sinNombre.map(v => v.gymId))];
    const gymMap = new Map<number, VisitRecord['gym']>();

    await Promise.allSettled(
      uniqueIds.map(async (gymId) => {
        try {
          const r = await visitsClient.get(`/api/gyms/${gymId}`);
          const g = r.data?.data ?? r.data;
          if (g?.id && g?.name) {
            gymMap.set(Number(g.id), {
              id: Number(g.id),
              name: g.name,
              location: g.location,
            });
          }
        } catch { /* sin datos del gym, el fallback mostrará el ID */ }
      })
    );

    return visits.map(v =>
      v.gym?.name ? v : { ...v, gym: gymMap.get(v.gymId) ?? v.gym }
    );
  },
};
