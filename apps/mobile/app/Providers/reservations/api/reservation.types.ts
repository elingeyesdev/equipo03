/**
 * Interfaces y tipos estrictos para el Módulo de Reservas
 * Sincronizados con el modelo real de la API de GymSync.
 */

export interface SubscriptionStatus {
  status: 'ACTIVO' | 'VENCIDO' | 'PAUSADO';
  planName: string;
  endDate: string;
  isActive: boolean;
}

// Días de la semana tal como los devuelve el backend
export type DayOfWeek = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM';

export interface GymActivitySchedule {
  id: number;
  gymActivityId: number;
  instructorId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  maxAttendees: number;
  isRecurring: boolean;
}

export interface GymActivity {
  id: number;
  gymId: number;
  name: string;
  description: string;
  defaultDurationMin: number;
  isActive: boolean;
  gym: {
    id: number;
    name: string;
    description: string;
    maxCapacity: number;
    isActive: boolean;
    isOpen: boolean;
  };
  schedules: GymActivitySchedule[];
}

// Payload exacto según el CreateReservationDto del Swagger
export interface CreateReservationPayload {
  userId: number;                // REQUERIDO por el backend
  gymActivityScheduleId: number; // ID del horario de la actividad
  reservationDate: string;       // Formato: "YYYY-MM-DD"
  status?: string;               // Opcional: "CONFIRMED" (default del backend)
}

export interface ReservationResponse {
  id: number;
  status: 'CONFIRMADA' | 'CANCELADA' | 'PENDING' | 'CONFIRMED';
  qrToken?: string;
  createdAt: string;
  reservationDate: string;
  gymActivityScheduleId: number;
}

export interface UserReservation {
  id: number;
  status: 'CONFIRMADA' | 'CANCELADA' | 'USADA' | 'CONFIRMED';
  reservationDate: string;
  qrToken?: string;
  cancelledAt?: string | null;
  canCancel?: boolean;
  // Mapeados desde gymActivitySchedule.gymActivity
  activityName?: string;
  activityDescription?: string;
  gymId?: number;
  gymName?: string;        // No viene en el response, se deja vacío
  startTime?: string;      // "HH:mm:ss"
  endTime?: string;
  dayOfWeek?: string;      // "SAB", "LUN", etc.
}

// Mapa de errores personalizado para la UI
export const ERROR_MAP: Record<string, string> = {
  SUBSCRIPTION_INACTIVE: 'Necesitas una membresía activa para reservar.',
  SLOT_FULL: 'Este horario ya está agotado.',
  DUPLICATE_RESERVATION: 'Ya tienes una reserva para este horario.',
  TOO_CLOSE_TO_START: 'No se pueden reservar clases con menos de 1h de anticipación.',
  CANCEL_WINDOW_EXPIRED: 'El plazo de cancelación gratuita ha expirado.',
};
