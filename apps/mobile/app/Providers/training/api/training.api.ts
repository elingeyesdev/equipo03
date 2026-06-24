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
import { attachOfflineInterceptor } from '../../offline/offlineInterceptor';
attachOfflineInterceptor(trainingClient);

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

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
  locationText?:   string | null;
  activityText?:   string | null;
  routineName?:    string | null;
  gymName?:        string | null;
  brandName?:      string | null;
  sets?:           WorkoutSet[];
  gym?: {
    id: number;
    name: string;
    parentId?: number | null;
    brand?: { id: number; name: string } | null;
  } | null;
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

  getHistory: async (params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<WorkoutSession>> => {
    const response = await trainingClient.get('/api/training/sessions', { params });
    return response.data;
  },

  getExercises: async (filters?: { muscleGroup?: string; category?: string; exerciseType?: string }): Promise<any[]> => {
    const response = await trainingClient.get('/api/exercises', { params: filters });
    // Backend returns flat Exercise[] (no pagination wrapper)
    return Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
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
      console.warn('[training] saveCompletedSession:', err?.response?.data?.message || err?.message);
      throw err;
    }
  },

  getGymLocations: async (params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<GymLocationItem>> => {
    const response = await trainingClient.get('/api/gyms/locations', { params });
    return response.data;
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

  getClientSessions: async (userId: number, routineId?: number, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<WorkoutSession>> => {
    const queryParams: any = { ...params };
    if (routineId) queryParams.routineId = routineId;
    const response = await trainingClient.get(`/api/training/sessions/user/${userId}`, { params: queryParams });
    return response.data;
  },
};
