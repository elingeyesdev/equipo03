export interface SubscriptionStatus {
  status: 'ACTIVO' | 'VENCIDO' | 'PAUSADO';
  planName: string;
  endDate: string;
  isActive: boolean;
}

export type DayOfWeek =
  | 'LUNES'    | 'MARTES'  | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO'    | 'DOMINGO'
  | 'LUN'      | 'MAR'     | 'MIE'       | 'JUE'    | 'VIE'     | 'SAB'       | 'DOM';

export interface GymActivitySchedule {
  id: number;
  gymActivityId: number;
  instructorId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  maxAttendees: number;
  isRecurring: boolean;
  // Instructor populado por el backend (via leftJoinAndSelect)
  instructor?: {
    id: number;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
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
  status: 'CONFIRMADA' | 'CANCELADA' | 'USADA' | 'USED' | 'CONFIRMED' | 'COMPLETADA' | 'CANCELLED' | 'PENDIENTE';
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
  gymName?: string;        // nombre de la sucursal (si el backend lo popula en gym.name)
  createdAt?: string;

  // Tiempos — libre: elegidos por el usuario; programada: copiados del Schedule
  startTime?: string;          // "HH:mm"
  endTime?: string;

  // Solo programada
  dayOfWeek?: string;          // "SAB", "LUN", etc.
  instructorName?: string;     // firstName + lastName del instructor
  instructorPhone?: string | null;
  gerentePhone?: string | null;
}

// Mapa de errores personalizado para la UI
export const ERROR_MAP: Record<string, string> = {
  SUBSCRIPTION_INACTIVE:  'Necesitas una membresía activa para reservar.',
  SLOT_FULL:              'Este horario ya está agotado.',
  DUPLICATE_RESERVATION:  'Ya tienes una reserva activa para esta actividad en esa fecha. Revisa "Mis Reservas".',
  TOO_CLOSE_TO_START:     'No se pueden reservar clases con menos de 1h de anticipación.',
  CANCEL_WINDOW_EXPIRED:  'El plazo de cancelación gratuita ha expirado.',
  // Variantes en español del backend
  RESERVA_DUPLICADA:      'Ya tienes una reserva activa para esta actividad en esa fecha. Revisa "Mis Reservas".',
  CUPO_AGOTADO:           'Este horario ya está agotado.',
  SUSCRIPCION_INACTIVA:   'Necesitas una membresía activa para reservar.',
};
