/**
 * Interfaces y tipos estrictos para el Módulo de Reservas
 */

export interface SubscriptionStatus {
  status: 'ACTIVO' | 'VENCIDO' | 'PAUSADO';
  planName: string;
  endDate: string;
  isActive: boolean;
}

export interface ScheduleSlot {
  id: number;
  gymId?: number;
  dayOfWeek: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  maxAttendees: number;
  activeReservations: number;
  instructorName?: string;
}

// Payload adaptado a la DB (3FN, sin gymId redundante)
export interface CreateReservationPayload {
  gymActivityScheduleId: number;
  reservationDate: string; // Formato: "YYYY-MM-DD"
}

export interface ReservationResponse {
  id: number;
  status: 'CONFIRMADA' | 'CANCELADA' | 'PENDING';
  qrToken?: string;
  createdAt: string;
  reservationDate: string;
  gymActivityScheduleId: number;
}

export interface UserReservation {
  id: number;
  status: 'CONFIRMADA' | 'CANCELADA' | 'USADA';
  reservationDate: string;
  gymName: string;
  scheduleTime: string;
  qrToken?: string;
  canCancel: boolean;
}

// Mapa de errores personalizado para la UI
export const ERROR_MAP: Record<string, string> = {
  SUBSCRIPTION_INACTIVE: 'Necesitas una membresía activa para reservar.',
  SLOT_FULL: 'Este horario ya está agotado.',
  DUPLICATE_RESERVATION: 'Ya tienes una reserva para este horario.',
  TOO_CLOSE_TO_START: 'No se pueden reservar clases con menos de 1h de anticipación.',
  CANCEL_WINDOW_EXPIRED: 'El plazo de cancelación gratuita ha expirado.',
};
