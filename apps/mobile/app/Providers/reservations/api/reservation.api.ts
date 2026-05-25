/**
 * Cliente Axios para el Módulo de Reservas
 * Endpoints sincronizados con el Swagger de GymSync API v1.0.0
 */
import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import {
  GymActivity,
  CreateReservationPayload,
  CreateFreeReservationPayload,
  ReservationResponse,
  UserReservation,
  SubscriptionStatus,
} from './reservation.types';
import { AuthService } from '../../auth/AuthService';
import { attach401Guard } from '../../auth/axios401Guard';

const reservationClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Interceptor de request: inyectar JWT ──────────────────────────────────────
reservationClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) {
      console.error('[ERROR AUTH] No hay token en el llavero seguro');
      return Promise.reject(new Error('Sin sesión activa.'));
    }
    const token = raw.trim();
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log(`[AUTH] ${config.method?.toUpperCase()} ${config.url} | Bearer ${token.substring(0, 25)}...`);
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Interceptor global 401 → alerta + logout + redirect al login ─────────────
attach401Guard(reservationClient);

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

  createFreeReservation: async (payload: CreateFreeReservationPayload): Promise<ReservationResponse> => {
    // Construcción ESTRICTA: solo los campos del flujo libre.
    // 'gymActivityScheduleId' NUNCA debe existir (ni como null, 0 o undefined).
    // 'activityId' es REQUERIDO por el backend para flujo isFreeAccess=true.
    const { gymId, activityId, reservationDate, startTime, endTime } = payload;
    const response = await reservationClient.post('/api/reservations', {
      gymId,
      activityId,
      reservationDate,
      startTime,
      endTime,
    });
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
    try {
      const response = await reservationClient.get(`/api/reservations/user/${user.userId}`);
      const raw = response.data?.data ?? response.data;
      const list: any[] = Array.isArray(raw) ? raw : [];

      return list.filter(Boolean).map((r: any) => {
        // Flujo libre  → r.gymActivitySchedule = null, r.activity = GymActivity
        // Flujo programado → r.gymActivitySchedule = Schedule, r.activity = null
        const schedule     = r?.gymActivitySchedule ?? null;
        const isFreeAccess = schedule === null;

        const freeAct    = r?.activity;                        // solo flujo libre
        const schedAct   = schedule?.gymActivity;              // solo flujo programado
        const instructor = schedule?.instructor;

        const firstName = instructor?.profile?.firstName ?? '';
        const lastName  = instructor?.profile?.lastName  ?? '';
        const instructorName = (firstName + ' ' + lastName).trim() || undefined;

        const st = String(r?.startTime ?? '').slice(0, 5) || undefined;
        const et = String(r?.endTime   ?? '').slice(0, 5) || undefined;

        return {
          id:                  r?.id,
          status:              r?.status,
          reservationDate:     typeof r?.reservationDate === 'string'
                                 ? r.reservationDate.substring(0, 10)
                                 : String(r?.reservationDate ?? '').substring(0, 10),
          qrToken:             r?.qrToken ?? undefined,
          cancelledAt:         r?.cancelledAt ?? null,
          canCancel:           !r?.cancelledAt && !['CANCELADA','CANCELLED','COMPLETADA','USADA'].includes(r?.status),
          isFreeAccess,
          activityName:        isFreeAccess ? freeAct?.name : schedAct?.name,
          activityDescription: isFreeAccess ? freeAct?.description : schedAct?.description,
          gymId:               r?.gymId ?? schedAct?.gymId,
          gymName:             r?.gym?.name ?? schedAct?.gym?.name ?? freeAct?.gym?.name ?? undefined,
          createdAt:           r?.createdAt,
          startTime:           st,
          endTime:             et,
          dayOfWeek:           schedule?.dayOfWeek,
          instructorName,
        };
      });
    } catch (err: any) {
      const status = err?.response?.status;
      console.error(`[Reservas] Error ${status ?? '?'}:`, err?.response?.data ?? err?.message);
      // 401 → ya lo maneja attach401Guard (alerta + logout automático)
      if (status === 403) {
        const payload = await AuthService.getTokenPayload();
        console.warn('[Reservas] JWT payload actual:', JSON.stringify(payload));
        throw Object.assign(new Error('FORBIDDEN'), { isForbidden: true });
      }
      if (status === 404) return [];
      throw err;
    }
  },

  /**
   * PUT /api/reservations/{id}/cancel
   */
  cancelReservation: async (reservationId: number): Promise<{ success: boolean }> => {
    const response = await reservationClient.put(`/api/reservations/${reservationId}/cancel`);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/reservations?date=YYYY-MM-DD
   * Para GERENTE: el backend filtra por gymId del JWT automáticamente.
   */
  getGymReservations: async (date?: string): Promise<any[]> => {
    const response = await reservationClient.get('/api/reservations', {
      params: date ? { date } : undefined,
    });
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * GET /api/reservations/gym
   * Auditoría de sede: gymId del JWT (applyListScope en backend).
   * Sin filtro de fecha — devuelve todas las reservas de la sede.
   */
  getGymReservationsByGymId: async (_gymId: number, _date?: string): Promise<any[]> => {
    const response = await reservationClient.get('/api/reservations/gym');
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * PATCH /api/reservations/:id/check-in
   * Marca la reserva como COMPLETADA (gerente valida QR de entrada).
   */
  checkInReservation: async (reservationId: number): Promise<{ success: boolean }> => {
    const response = await reservationClient.patch(`/api/reservations/${reservationId}/check-in`);
    return response.data?.data ?? response.data;
  },

  /**
   * PUT /api/reservations/{id}/confirm
   */
  confirmReservation: async (reservationId: number): Promise<{ success: boolean }> => {
    const response = await reservationClient.put(`/api/reservations/${reservationId}/confirm`);
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
