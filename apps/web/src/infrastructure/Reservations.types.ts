export interface Reservation {
  id: number;
  userId: number;
  gymActivityScheduleId: number;
  reservationDate: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'USED' | 'PENDING';
  qrToken?: string;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    profile?: {
      fullName: string;
      firstName?: string;
      lastName?: string;
      first_name?: string; // Variantes snake_case del backend
      last_name?: string;
      ci?: string; // Carnet de Identidad
      avatarUrl?: string;
    };
  };
  gymActivitySchedule?: {
    id: number;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
    gymActivity: {
      id: number;
      name: string;
      gymId: number;
      gym?: {
        name: string;
      };
    };
  };
}

export interface ReservationFilters {
  gymId?: number;
  status?: string;
  date?: string;
}
