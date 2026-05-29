export interface ActivityInfo {
  id?: number;
  name?: string;
  gymId?: number;
  gym?: { id?: number; name?: string };
}

export interface Reservation {
  id: number;
  userId: number;
  gymActivityScheduleId?: number;
  reservationDate: string;
  status: string;
  qrToken?: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  user?: {
    id: number;
    email: string;
    profile?: {
      fullName: string;
      ci?: string;
      avatarUrl?: string;
    };
  };
  // Actividades tipo Horarios (a través de schedule)
  gymActivitySchedule?: {
    id: number;
    startTime?: string;
    endTime?: string;
    dayOfWeek?: string;
    gymActivity?: ActivityInfo;
  };
  // Actividades tipo Libre y aliases alternativos del backend
  freeActivity?: ActivityInfo;
  activity?: ActivityInfo;
  gymActivity?: ActivityInfo;
}

export interface ReservationFilters {
  gymId?: number;
  status?: string;
  date?: string;
}
