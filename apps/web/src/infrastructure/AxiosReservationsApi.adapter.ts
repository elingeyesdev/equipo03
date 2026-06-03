import { apiClient } from './api.config';
import type { Reservation, ReservationFilters } from './Reservations.types';

export class AxiosReservationsApiAdapter {
  async getReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
    try {
      const response = await apiClient.get('/reservations', { params: filters });
      const raw: any[] = Array.isArray(response.data) ? response.data : [];
      // Diagnóstico: muestra la estructura real del primer elemento en consola
      if (raw.length > 0) {
        console.log('[Reservations Debug] Estructura del primer ítem:', JSON.stringify(raw[0], null, 2));
      }
      return raw;
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

  async acceptReservation(reservationId: number, userId: number, _gymId: number): Promise<{ success: boolean; error?: string }> {
    const is404or405 = (e: any) => e?.response?.status === 404 || e?.response?.status === 405;

    // Intento 1: PUT /reservations/{id}/confirm
    try {
      await apiClient.put(`/reservations/${reservationId}/confirm`);
      return { success: true };
    } catch (e: any) { if (!is404or405(e)) return { success: false, error: e?.response?.data?.message || e?.message }; }

    // Intento 2: PATCH /reservations/{id} con status COMPLETADA
    try {
      await apiClient.patch(`/reservations/${reservationId}`, { status: 'COMPLETADA' });
      return { success: true };
    } catch (e: any) { if (!is404or405(e)) return { success: false, error: e?.response?.data?.message || e?.message }; }

    // Intento 3: PUT /reservations/{id} con status COMPLETADA
    try {
      await apiClient.put(`/reservations/${reservationId}`, { status: 'COMPLETADA' });
      return { success: true };
    } catch (e: any) { if (!is404or405(e)) return { success: false, error: e?.response?.data?.message || e?.message }; }

    // Intento 4: POST /checkins con los únicos campos que acepta el backend
    try {
      await apiClient.post('/checkins', { userId: String(userId), method: 'QR' });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.response?.data?.message || e?.message || 'Error al registrar acceso' };
    }
  }

  /**
   * Valida un token QR escaneado.
   * Devuelve la reserva si el token coincide con alguna activa.
   */
  async validateQrToken(token: string): Promise<Reservation | null> {
    // Formato legado GS-RES-{id}
    const idMatch = token.match(/^GS-RES-(\d+)$/);
    if (idMatch) {
      try {
        const response = await apiClient.get(`/reservations/${parseInt(idMatch[1])}`);
        return response.data;
      } catch { return null; }
    }

    // Intento 1: GET /reservations/validate (puede fallar con 403 para GERENTE)
    try {
      const response = await apiClient.get('/reservations/validate', { params: { token } });
      return response.data;
    } catch (e: any) {
      if (e?.response?.status !== 403 && e?.response?.status !== 401) {
        console.error('[Reservations API] QR validation error:', e);
        return null;
      }
    }

    // Intento 2: POST /reservations/check-in/token (el GERENTE sí puede usar este endpoint)
    try {
      const response = await apiClient.post('/reservations/check-in/token', { token });
      // Si el backend devuelve la reserva completa, usarla; si solo da {success}, retornar token parcial
      const data = response.data?.reservation ?? response.data?.data ?? response.data;
      if (data?.id) return data as Reservation;
      // Reserva aceptada en un solo paso — retornar objeto mínimo para cerrar el flujo
      return { id: data?.reservationId ?? 0, userId: 0, status: 'CONFIRMADA', reservationDate: '', createdAt: '', qrToken: token } as Reservation;
    } catch (e: any) {
      console.error('[Reservations API] QR check-in/token error:', e);
      return null;
    }
  }
}

export const reservationsApi = new AxiosReservationsApiAdapter();
