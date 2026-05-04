/**
 * Cliente Axios para el Módulo de Reservas
 */
import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { 
  ScheduleSlot, 
  CreateReservationPayload, 
  ReservationResponse, 
  UserReservation,
  SubscriptionStatus
} from './reservation.types';

import { AuthService } from '../../auth/AuthService';

// Creamos un cliente dedicado para reservas usando la configuración base
const reservationClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para logs y tokens (Inyecta el token de AsyncStorage automáticamente)
reservationClient.interceptors.request.use(
  async (config) => {
    // Inyectamos el token dinámicamente desde nuestro AuthService (AsyncStorage)
    const token = await AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (Env.isDevelopment) {
      console.log(`[API RESERVACIONES] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const reservationApi = {
  
  // 1. Obtener estado de la suscripción del usuario logueado
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await reservationClient.get('/api/users/me/subscription');
    return response.data?.data ? response.data.data : response.data;
  },

  // 2. Obtener los horarios de una actividad específica en una fecha
  getSchedules: async (activityId: number, date: string): Promise<ScheduleSlot[]> => {
    const response = await reservationClient.get(`/api/gym-activities/${activityId}/schedules`, {
      params: { date }
    });
    return response.data?.data ? response.data.data : response.data;
  },

  // 3. Crear la reserva
  createReservation: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    const response = await reservationClient.post('/api/reservations', payload);
    return response.data?.data ? response.data.data : response.data;
  },

  // 4. Obtener el historial de reservas del usuario
  getMyReservations: async (): Promise<UserReservation[]> => {
    const response = await reservationClient.get('/reservations/me');
    return response.data?.data ? response.data.data : response.data;
  },

  // 5. Cancelar una reserva
  cancelReservation: async (reservationId: number): Promise<{ success: boolean }> => {
    const response = await reservationClient.post(`/reservations/${reservationId}/cancel`);
    return response.data?.data ? response.data.data : response.data;
  }
};
