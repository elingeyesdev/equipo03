import { apiClient } from './api.config';
import type { Reservation, ReservationFilters } from './Reservations.types';

/** Soporta array directo o envoltorios típicos del backend. */
function unwrapListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const keys = ['data', 'items', 'reservations', 'content', 'results', 'rows'] as const;
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

export class AxiosReservationsApiAdapter {
  /**
   * Listado administrativo (p. ej. gerente): GET /api/reservations
   * Si tu API no tiene este endpoint, verás error en UI (antes se ocultaba devolviendo []).
   */
  async getReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
    const response = await apiClient.get('/reservations', { params: filters });
    return unwrapListPayload(response.data) as Reservation[];
  }

  /**
   * Reservas del usuario autenticado (alineado con la app móvil): GET /api/reservations/user/:userId
   */
  async getReservationsForUser(userId: string | number): Promise<Reservation[]> {
    const response = await apiClient.get(`/reservations/user/${userId}`);
    return unwrapListPayload(response.data) as Reservation[];
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
      await apiClient.put(`/reservations/${reservationId}/confirm`);
      return { success: true };
    } catch (err: any) {
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
   */
  async validateQrToken(token: string): Promise<Reservation | null> {
    try {
      const idMatch = token.match(/^GS-RES-(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const response = await apiClient.get(`/reservations/${id}`);
        const raw = response.data;
        if (raw && typeof raw === 'object' && 'id' in (raw as object)) return raw as Reservation;
        const inner = unwrapListPayload(raw)[0];
        return (inner as Reservation) ?? null;
      }
      const response = await apiClient.get('/reservations/validate', { params: { token } });
      const raw = response.data;
      if (raw && typeof raw === 'object' && 'id' in (raw as object)) return raw as Reservation;
      const inner = unwrapListPayload(raw)[0];
      return (inner as Reservation) ?? null;
    } catch (error) {
      console.error('[Reservations API] QR validation error:', error);
      return null;
    }
  }
}

export const reservationsApi = new AxiosReservationsApiAdapter();
