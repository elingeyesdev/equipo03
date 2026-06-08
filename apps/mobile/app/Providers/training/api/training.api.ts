import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { AuthService } from '../../auth/AuthService';
import { attach401Guard } from '../../auth/axios401Guard';

const trainingClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

trainingClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(trainingClient);

export type WorkoutSet = {
  id:               number;
  setNumber:        number;
  repsCompleted:    number;
  weightUsedKg:     number | null;
  restTakenSeconds: number | null;
};

export type WorkoutSession = {
  id:              number;
  durationSeconds: number | null;
  caloriesBurned:  number | null;
  sportType:       string | null;
  startedAt:       string;
  finishedAt:      string | null;
  status:          string;
  sets?:           WorkoutSet[];
  gym?:            { id: number; name: string } | null;
  routine?:        { id: number; name: string } | null;
};

export const trainingApi = {

  getHistory: async (): Promise<WorkoutSession[]> => {
    try {
      const response = await trainingClient.get('/api/training/sessions');
      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch (err: any) {
      const status = err?.response?.status;
      console.warn('[Training] Error getHistory:', status ?? err?.message);
      if (status === 404) return [];
      throw err;
    }
  },

  saveCompletedSession: async (payload: {
    gymId?:          number;
    sportType?:      string;
    durationSeconds: number;
    caloriesBurned:  number;
  }): Promise<WorkoutSession | null> => {
    try {
      const response = await trainingClient.post('/api/training/sessions/completed', payload);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      console.warn('[Training] Error saveCompleted:', err?.response?.status ?? err?.message);
      return null;
    }
  },
};
