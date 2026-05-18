import type { InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './api.config';
import type {
  CreateActivitySchedulePayload,
  GymActivityListItem,
  GymActivityScheduleDto,
} from './activities.types';

/** Igual que en AxiosReservationsApi: respuestas envueltas o array plano. */
function unwrapListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const keys = ['data', 'items', 'activities', 'content', 'results', 'rows'] as const;
    for (const key of keys) {
      const v = o[key];
      if (Array.isArray(v)) return v;
      if (v != null && typeof v === 'object' && Array.isArray((v as Record<string, unknown>).data)) {
        return (v as { data: unknown[] }).data;
      }
    }
  }
  return [];
}

type SkipToastConfig = InternalAxiosRequestConfig & { _skipErrorToast?: boolean };

export class AxiosActivitiesApiAdapter {
  /**
   * Lista actividades por sede (`GET /api/activities?gymId=`).
   * El gerente debe pasar el gymId de su sede (coherente con el JWT).
   */
  async getActivities(gymId: number): Promise<GymActivityListItem[]> {
    const response = await apiClient.get('/activities', {
      params: { gymId },
    });
    return unwrapListPayload(response.data) as GymActivityListItem[];
  }

  async getActivitySchedules(activityId: number): Promise<GymActivityScheduleDto[]> {
    const response = await apiClient.get(`/activities/${activityId}/schedules`);
    return unwrapListPayload(response.data) as GymActivityScheduleDto[];
  }

  /**
   * Crea horario. `_skipErrorToast` evita toast genérico del interceptor (409 con mensaje propio).
   */
  async createActivitySchedule(
    activityId: number,
    payload: CreateActivitySchedulePayload,
  ): Promise<GymActivityScheduleDto> {
    const response = await apiClient.post(`/activities/${activityId}/schedules`, payload, {
      _skipErrorToast: true,
    } as SkipToastConfig);
    const body = response.data;
    if (body != null && typeof body === 'object' && 'id' in body) {
      return body as GymActivityScheduleDto;
    }
    return body as GymActivityScheduleDto;
  }
}

export const activitiesApi = new AxiosActivitiesApiAdapter();
