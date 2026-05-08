import { apiClient } from './api.config';
import type { Reservation, ReservationFilters } from './Reservations.types';

export class AxiosReservationsApiAdapter {
  async getReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
    try {
      const response = await apiClient.get('/reservations', { params: filters });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[Reservations API] Error fetching:', error);
      return [];
    }
  }

  async cancelReservation(id: number): Promise<boolean> {
    try {
      await apiClient.put(`/reservations/${id}/cancel`);
      return true;
    } catch (error) {
      console.error('[Reservations API] Error cancelling:', error);
      return false;
    }
  }

  /**
   * Acepta la entrada del usuario: marca la reserva como USED y registra el check-in.
   * Intenta PUT /reservations/{id}/confirm — si no existe, usa POST /checkins.
   */
  async acceptReservation(reservationId: number, userId: number, gymId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Primer intento: marcar directamente como USED
      await apiClient.put(`/reservations/${reservationId}/confirm`);
      return { success: true };
    } catch (err: any) {
      // Fallback: registrar como checkin si el endpoint de confirm no existe
      if (err?.response?.status === 404) {
        try {
          await apiClient.post('/checkins', {
            reservationId,
            userId,
            gymId,
            checkInTime: new Date().toISOString(),
            method: 'QR',
          });
          return { success: true };
        } catch (innerErr: any) {
          const msg = innerErr?.response?.data?.message || innerErr?.message || 'Error desconocido';
          return { success: false, error: msg };
        }
      }
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      return { success: false, error: msg };
    }
  }

  /**
   * Valida un token QR escaneado.
   * Devuelve la reserva si el token coincide con alguna activa.
   */
  async validateQrToken(token: string): Promise<Reservation | null> {
    try {
      // Formato: GS-RES-{id} o token directo del backend
      const idMatch = token.match(/^GS-RES-(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        const response = await apiClient.get(`/reservations/${id}`);
        return response.data;
      }
      // Si es un token directo, buscar por token
      const response = await apiClient.get('/reservations/validate', { params: { token } });
      return response.data;
    } catch (error) {
      console.error('[Reservations API] QR validation error:', error);
      return null;
    }
  }
}

export const reservationsApi = new AxiosReservationsApiAdapter();
