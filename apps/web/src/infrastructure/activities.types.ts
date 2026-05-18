/** Días canónicos alineados con el backend (`CreateActivityScheduleDto`). */
export type ActivityDayOfWeek =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export interface CreateActivitySchedulePayload {
  instructorId: number;
  dayOfWeek: ActivityDayOfWeek;
  startTime: string;
  endTime: string;
  maxAttendees: number;
  isRecurring?: boolean;
}

export interface GymActivityScheduleDto {
  id: number;
  gymActivityId: number;
  instructorId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxAttendees: number;
  isRecurring: boolean;
}

export interface GymActivityListItem {
  id: number;
  gymId: number;
  name: string;
  description?: string | null;
  defaultDurationMin?: number | null;
  isActive?: boolean;
  schedules?: GymActivityScheduleDto[];
}
