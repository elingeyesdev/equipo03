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
  repsCompleted:    number | null;
  weightUsedKg:     number | null;
  durationSeconds:  number | null;
  distanceMeters:   number | null;
  restTakenSeconds: number | null;
  exercise?: { id: number; name: string; muscleGroup?: string } | null;
  exerciseName?: string;
  routineExercise?: {
    id?: number;
    setsRecommended?: number;
    repsRecommended?: any;
    weightRecommendedKg?: number | null;
    exercise?: { name: string } | null;
  } | null;
};

export type WorkoutSession = {
  id:              number;
  routineId?:      number | null;
  trainerId?:      number | null;
  trainerName?:    string | null;
  userId?:         number;
  durationSeconds: number | null;
  caloriesBurned:  number | null;
  sportType:       string | null;
  startedAt:       string;
  finishedAt:      string | null;
  status:          'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'FINISHED' | 'CANCELLED' | string;
  locationText?:   string;
  gymName?:        string | null;
  brandName?:      string | null;
  sets?:           WorkoutSet[];
  gym?:            { id: number; name: string } | null;
  routine?: {
    id: number;
    name: string;
    difficultyLevel?: string | null;
    exercises?: {
      id: number;
      orderPosition: number;
      setsRecommended: number;
      repsRecommended: any;
      weightRecommendedKg?: number | null;
      exercise?: { id: number; name: string; muscleGroup?: string } | null;
    }[];
  } | null;
};

export type GymLocationItem = {
  gymId:     number;
  gymName:   string;
  brandName: string | null;
  latitude:  number;
  longitude: number;
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

  getExercises: async (): Promise<any[]> => {
    try {
      const response = await trainingClient.get('/api/exercises');
      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch (err: any) {
      console.warn('[Training] Error getExercises:', err?.response?.status ?? err?.message);
      return [];
    }
  },

  saveCompletedSession: async (payload: {
    gymId?:          number;
    sportType?:      string;
    durationSeconds: number;
    caloriesBurned:  number;
    sets?:           any[];
  }): Promise<WorkoutSession | null> => {
    try {
      const response = await trainingClient.post('/api/training/sessions/completed', payload);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      console.error('ERROR 400 DETALLE:', err?.response?.data?.message || err?.message);
      throw err;
    }
  },

  getGymLocations: async (): Promise<GymLocationItem[]> => {
    try {
      const response = await trainingClient.get('/api/gyms/locations');
      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  startRoutineSession: async (data: {
    routineId: number;
    gymId?: number | null;
    sportType?: string;
  }): Promise<WorkoutSession> => {
    const body: Record<string, any> = {
      routineId: data.routineId,
      status:    'IN_PROGRESS',
      sportType: data.sportType ?? 'MUSCULACION',
    };
    if (data.gymId != null) body.gymId = data.gymId;
    const response = await trainingClient.post('/api/training/sessions', body);
    return response.data?.data ?? response.data;
  },

  addSet: async (sessionId: number, data: {
    routineExerciseId?: number | null;
    exerciseId?:        number | null;
    setNumber:          number;
    repsCompleted?:     number;
    weightUsedKg?:      number;
  }): Promise<void> => {
    await trainingClient.post(`/api/training/sessions/${sessionId}/sets`, data);
  },

  finishSession: async (
    sessionId:       number,
    status:          'COMPLETED' | 'PARTIAL',
    durationSeconds: number,
  ): Promise<WorkoutSession> => {
    const response = await trainingClient.put(`/api/training/sessions/${sessionId}`, {
      status,
      durationSeconds,
    });
    return response.data?.data ?? response.data;
  },

  getClientSessions: async (userId: number, routineId?: number): Promise<WorkoutSession[]> => {
    try {
      const params: any = {};
      if (routineId) params.routineId = routineId;
      const response = await trainingClient.get(`/api/training/sessions/user/${userId}`, { params });
      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
};
