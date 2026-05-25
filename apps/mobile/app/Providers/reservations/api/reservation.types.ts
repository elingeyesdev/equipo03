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
  isFreeAccess?: boolean;
  gym: {
    id: number;
    name: string;
    description: string;
    maxCapacity: number;
    isActive: boolean;
    isOpen: boolean;
  };
  // El backend serializa como 'schedules' (propiedad TypeORM).
  // Se acepta también 'gymActivitySchedules' por si cambia el naming.
  schedules?: GymActivitySchedule[];
  gymActivitySchedules?: GymActivitySchedule[];
}

export interface CreateReservationPayload {
  gymActivityScheduleId: number;
  reservationDate: string;
}

export interface CreateFreeReservationPayload {
  gymId: number;
  activityId: number;   // REQUERIDO por el backend para flujo isFreeAccess=true
  reservationDate: string;
  startTime: string;    // formato HH:mm
  endTime: string;      // formato HH:mm
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
  status: 'CONFIRMADA' | 'CANCELADA' | 'USADA' | 'CONFIRMED' | 'COMPLETADA' | 'CANCELLED' | 'PENDIENTE';
  reservationDate: string;
  qrToken?: string;
  cancelledAt?: string | null;
  canCancel?: boolean;

  // Discriminador de flujo
  isFreeAccess?: boolean;      // true = Cardio/libre, false = Zumba/programada

  // Datos comunes
  activityName?: string;
  activityDescription?: string;
  gymId?: number;
  createdAt?: string;

  // Tiempos — libre: elegidos por el usuario; programada: copiados del Schedule
  startTime?: string;          // "HH:mm"
  endTime?: string;

  // Solo programada
  dayOfWeek?: string;          // "SAB", "LUN", etc.
  instructorName?: string;     // firstName + lastName del instructor
}

// Mapa de errores personalizado para la UI
export const ERROR_MAP: Record<string, string> = {
  SUBSCRIPTION_INACTIVE: 'Necesitas una membresía activa para reservar.',
  SLOT_FULL: 'Este horario ya está agotado.',
  DUPLICATE_RESERVATION: 'Ya tienes una reserva para este horario.',
  TOO_CLOSE_TO_START: 'No se pueden reservar clases con menos de 1h de anticipación.',
  CANCEL_WINDOW_EXPIRED: 'El plazo de cancelación gratuita ha expirado.',
};
