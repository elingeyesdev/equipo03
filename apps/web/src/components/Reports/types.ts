export type ReportType = 'asistencia' | 'maquinas' | 'consolidado';

export type DatePreset = 'hoy' | 'semana' | 'mes' | 'personalizado';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to:   string; // YYYY-MM-DD
}

export interface ReportFilters {
  type:    ReportType;
  range:   DateRange;
  gymId?:  number;
  gymName?: string;
}

export interface GymOption {
  id:          number;
  name:        string;
  parentName?: string;
}

// ── Check-in DTO (from GET /checkins/gym/:gymId) ──────────────────────────────
export interface CheckInDto {
  id:          number;
  checkInTime: string;  // ISO timestamp
  gymId:       number;
  userProfile: { fullName: string; role: string };
}

// ── Machine DTO (from GET /machines) ─────────────────────────────────────────
export interface MachineDto {
  id:        string;
  gymId:     number;
  name:      string;
  status:    'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  category:  'CARDIO' | 'TREN_SUPERIOR' | 'TREN_INFERIOR' | 'ESPALDA' | 'MULTIESTACION';
  updatedAt: string;
  gym?:      { id: number; name: string };
}

// ── Reservation DTO (from GET /reservations) ─────────────────────────────────
export interface ReservationDto {
  id:              number;
  reservationDate: string;
  startTime:       string;
  status:          string;
  gym?:            { id: number; name: string; brand?: { id: number; name: string } };
  freeActivity?:   { id: number; name: string } | null;
  gymActivitySchedule?: {
    gymActivity?: { id: number; name: string } | null;
  } | null;
}

// ── User DTO (from GET /users) ────────────────────────────────────────────────
export interface UserDto {
  id:       number;
  isActive: boolean;
  userRoles?: { gym?: { id: number; name?: string }; role?: { name: string } }[];
}

export const CATEGORY_LABELS: Record<string, string> = {
  CARDIO:        'Cardio',
  TREN_SUPERIOR: 'Tren Superior',
  TREN_INFERIOR: 'Tren Inferior',
  ESPALDA:       'Espalda',
  MULTIESTACION: 'Multiestación',
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:   'Disponible',
  IN_USE:      'En Uso',
  MAINTENANCE: 'Mantenimiento',
};

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:   '#00E5A3',
  IN_USE:      '#FF5E00',
  MAINTENANCE: '#e74c3c',
};

export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_ORDER  = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

/** Formats a date string (YYYY-MM-DD) as "15 jun. 2026" */
export function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Returns "today" as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the Monday of the current week as YYYY-MM-DD */
export function weekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns the 1st of current month as YYYY-MM-DD */
export function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Returns the 1st of previous month as YYYY-MM-DD */
export function prevMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

/** Returns the last day of previous month as YYYY-MM-DD */
export function prevMonthEnd(): string {
  const d = new Date();
  d.setDate(0); // last day of prev month
  return d.toISOString().slice(0, 10);
}

/** Filters items by date range using a date string field */
export function inRange(dateStr: string, from: string, to: string): boolean {
  const d = dateStr.slice(0, 10);
  return d >= from && d <= to;
}
