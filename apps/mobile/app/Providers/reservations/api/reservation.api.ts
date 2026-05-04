/**
 * Cliente Axios para el Módulo de Reservas
 * Endpoints sincronizados con el Swagger de GymSync API v1.0.0
 */
import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import {
  GymActivity,
  CreateReservationPayload,
  ReservationResponse,
  UserReservation,
  SubscriptionStatus,
} from './reservation.types';
import { AuthService } from '../../auth/AuthService';

const reservationClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor: inyecta el JWT en cada petición
reservationClient.interceptors.request.use(
  async (config) => {
    const token = await AuthService.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (Env.isDevelopment) {
      console.log(`[API RESERVACIONES] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const reservationApi = {

  /**
   * GET /api/activities?gymId=:gymId
   * gymId es un query param REQUERIDO según el Swagger.
   */
  getGymActivities: async (gymId: number): Promise<GymActivity[]> => {
    const response = await reservationClient.get('/api/activities', {
      params: { gymId },
    });
    const data = response.data?.data ?? response.data;
    const all: GymActivity[] = Array.isArray(data) ? data : [];
    return all.filter((a) => a.isActive !== false);
  },

  /**
   * GET /api/activities/{id}/schedules
   * Horarios de una actividad específica.
   */
  getActivitySchedules: async (activityId: number) => {
    const response = await reservationClient.get(`/api/activities/${activityId}/schedules`);
    return response.data?.data ?? response.data;
  },

  /**
   * POST /api/reservations
   * Crear una nueva reserva.
   */
  createReservation: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    const response = await reservationClient.post('/api/reservations', payload);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/reservations/user/{userId}
   * El backend devuelve los datos anidados:
   *   reservation.gymActivitySchedule.gymActivity.name  → nombre de actividad
   *   reservation.gymActivitySchedule.startTime         → hora inicio
   *   reservation.gymActivitySchedule.dayOfWeek         → día
   */
  getMyReservations: async (): Promise<UserReservation[]> => {
    const user = await AuthService.getCurrentUser();
    if (!user?.userId) return [];
    const response = await reservationClient.get(`/api/reservations/user/${user.userId}`);
    const raw = response.data?.data ?? response.data;
    const list: any[] = Array.isArray(raw) ? raw : [];

    return list.map((r) => {
      const schedule = r.gymActivitySchedule;
      const activity = schedule?.gymActivity;
      return {
        id: r.id,
        status: r.status,
        reservationDate: r.reservationDate,
        qrToken: r.qrToken ?? undefined,
        cancelledAt: r.cancelledAt ?? null,
        canCancel: !r.cancelledAt,
        // Datos reales del backend — sin mocks
        activityName: activity?.name,
        activityDescription: activity?.description,
        gymId: activity?.gymId,
        startTime: schedule?.startTime,
        endTime: schedule?.endTime,
        dayOfWeek: schedule?.dayOfWeek,
      };
    });
  },

  /**
   * PUT /api/reservations/{id}/cancel
   * Cancelar una reserva (PUT, no POST).
   */
  cancelReservation: async (reservationId: number): Promise<{ success: boolean }> => {
    const response = await reservationClient.put(`/api/reservations/${reservationId}/cancel`);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/subscriptions/user/{userId}
   * Estado de suscripción del usuario.
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const user = await AuthService.getCurrentUser();
    if (!user?.userId) throw new Error('Usuario no autenticado');
    const response = await reservationClient.get(`/api/subscriptions/user/${user.userId}`);
    // El endpoint devuelve un array, tomamos la más reciente
    const data = response.data?.data ?? response.data;
    const subs = Array.isArray(data) ? data : [data];
    const active = subs.find((s: any) => s.status === 'ACTIVO' || s.isActive) ?? subs[0];
    return active;
  },
};
