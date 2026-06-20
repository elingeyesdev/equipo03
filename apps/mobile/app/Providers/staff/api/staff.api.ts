import axios from 'axios';
import { Env } from '../../geolocation/config/environment';
import { AuthService } from '../../auth/AuthService';
import { attach401Guard } from '../../auth/axios401Guard';

const staffClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

staffClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(staffClient);
import { attachOfflineInterceptor } from '../../offline/offlineInterceptor';
attachOfflineInterceptor(staffClient);

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StaffClass = {
  id:            number;
  activityName:  string;
  startTime:     string;   // HH:mm
  endTime:       string;   // HH:mm
  enrolledCount: number;
  maxAttendees?: number;
  maxCapacity?:  number;   // alias que algunos endpoints devuelven
  location?:     string;
  status?:       string;
  reservations?: { id: number; user?: { id: number; email?: string } }[];
  attendees?:    { id: number | string; fullName: string }[];
};

export type StaffAppointment = {
  id:          number;
  startTime:   string;   // HH:mm
  endTime:     string;   // HH:mm
  patientName: string;
  notes?:      string;
  status?:     string;
};

export type MyStudent = {
  id:         number;
  name?:      string;
  firstName?: string;
  lastName?:  string;
  email?:     string;
  avatarUrl?: string;
};

export type MyAppointment = {
  id:              number;
  startTime:       string;   // HH:mm
  endTime:         string;   // HH:mm
  patientName:     string;
  appointmentType?: string;  // PLAN_DIETA | SEGUIMIENTO | EVALUACION | etc.
  notes?:          string;
  status:          string;   // PENDIENTE | COMPLETADA | CANCELADA
};

export type ScheduleReservation = {
  id:         number;
  status:     string;
  userId:     string;
  createdAt?: string;
  date?:      string;
  user?: {
    id:       number;
    email?:   string;
    profile?: { firstName?: string; lastName?: string; fullName?: string };
  };
};

export type UserSearchResult = {
  id:       number;
  email?:   string;
  fullName: string;
};

export type AdvisorRequest = {
  id:          number;
  clientName?: string;
  fullName?:   string;
  status?:     string;
  createdAt?:  string;
  user?: { profile?: { firstName?: string; lastName?: string } };
};

export type StaffCatalogEntry = {
  id:          number;
  branchId?:   number;
  gymId?:      number;
  fullName?:   string;
  name?:       string;
  firstName?:  string;
  lastName?:   string;
  role?:       string;
  branchName?: string;
  gymName?:    string;
  brandName?:  string;
  profile?: {
    firstName?: string;
    lastName?:  string;
    avatarUrl?: string;
  };
  gym?: { name?: string; parent?: { name?: string } };
};

export type ClassStudent = {
  clientId:   number;
  clientName: string;
  classCount: number;
};

export type AdvisorRequestStatus = {
  id:          number;
  advisorId:   number;
  advisorName: string;
  advisorRole: string;
  branchName:  string;
  status:      'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED';
  createdAt:   string;
};

export type InstructorWeeklySchedule = {
  id:            number;
  activityName:  string;
  gymName:       string;
  dayOfWeek:     string;
  startTime:     string;
  endTime:       string;
  maxCapacity:   number;
  enrolledCount: number;
  attendees:     { id: number | null; fullName: string }[];
};

export type AttendanceStat = {
  label: string;
  value: number;
};

export type PendingTrainerRequest = {
  id:         number;
  clientId:   number;
  clientName: string;
  phone:      string | null;
  createdAt:  string;
};

export type ActiveAdvisee = {
  id:         number;
  clientId:   number;
  clientName: string;
  phone:      string | null;
};

export type ClientProfile = {
  clientId:          number;
  firstName:         string;
  lastName:          string;
  phone:             string | null;
  ci:                string | null;
  gender:            string | null;
  heightCm:          number | null;
  medicalConditions: string | null;
  latestMetrics: {
    recordedAt:        string;
    weightKg:          number | null;
    bodyFatPercentage: number | null;
    muscleMassKg:      number | null;
    waistCm:           number | null;
    chestCm:           number | null;
  } | null;
};

export type ClientRoutineExercise = {
  id:                      number;
  orderPosition:           number;
  dayOfWeek?:              string | null;
  setsRecommended?:        number | null;
  repsRecommended?:        string | null;
  weightRecommendedKg?:    number;
  restSecondsBetweenSets?: number;
  notes?:                  string;
  params?:                 Record<string, any> | null;
  exercise: {
    id:            number;
    name:          string;
    muscleGroup?:  string;
    category?:     string;
    exerciseType?: string;
    logType?:      'WEIGHT_REPS' | 'REPS_ONLY' | 'TIME_DISTANCE' | 'TIME_ONLY';
    youtubeVideoId?: string | null;
    imageUrl?: string | null;
    equipmentRequired?: string | null;
  };
};

export type ClientRoutine = {
  id:               number;
  name:             string;
  difficultyLevel:  string;
  durationWeeks?:   number;
  createdAt?:       string;
  exercises:        ClientRoutineExercise[];
};

export type MealDay = {
  desayuno?: string;
  almuerzo?: string;
  cena?:     string;
  merienda?: string;
};

export type MealPlan = Partial<Record<
  'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO',
  MealDay
>>;

export type TrainerPlanData = {
  id?:        number;
  dailyKcal?: number;
  proteinG?:  number;
  carbsG?:    number;
  fatG?:      number;
  planNotes?: string;
  mealPlan?:  MealPlan | null;
  updatedAt?: string;
};

export type Exercise = {
  id:            number;
  name:          string;
  description?:  string;
  muscleGroup?:  string;
  category?:     string;
  exerciseType?: string;
};

export type SelectedExercise = {
  exerciseId:              number;
  dayOfWeek?:              string;
  orderPosition?:          number;
  setsRecommended?:        number;
  repsRecommended?:        string;
  weightRecommendedKg?:    number;
  restSecondsBetweenSets?: number;
  notes?:                  string;
  params?:                 Record<string, any>;
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const staffApi = {
  /**
   * GET /api/staff/agenda/classes
   * Clases de hoy asignadas al entrenador/instructor autenticado.
   */
  getTodayClasses: async (): Promise<StaffClass[]> => {
    const response = await staffClient.get('/api/staff/agenda/classes');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/staff/agenda/appointments
   * Citas de hoy asignadas al nutricionista autenticado.
   */
  getTodayAppointments: async (): Promise<StaffAppointment[]> => {
    const response = await staffClient.get('/api/staff/agenda/appointments');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/routines/my-students
   * Alumnos asignados al entrenador autenticado vía rutinas.
   */
  getMyStudents: async (): Promise<MyStudent[]> => {
    const response = await staffClient.get('/api/routines/my-students');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/staff/appointments
   * Todas las citas del nutricionista autenticado.
   */
  getMyAppointments: async (): Promise<MyAppointment[]> => {
    const response = await staffClient.get('/api/staff/appointments');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * PATCH /api/staff/appointments/:id/status
   * Actualiza el estado de una cita.
   */
  updateAppointmentStatus: async (id: number, status: string): Promise<void> => {
    await staffClient.patch(`/api/staff/appointments/${id}/status`, { status });
  },

  getScheduleReservations: async (scheduleId: number): Promise<ScheduleReservation[]> => {
    const response = await staffClient.get('/api/reservations', {
      params: { gymActivityScheduleId: scheduleId },
    });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  bulkUpdateStatus: async (
    reservationIds: number[],
    status: 'COMPLETADA' | 'FALTO',
  ): Promise<void> => {
    await staffClient.patch('/api/reservations/bulk-status', { reservationIds, status });
  },

  createWalkIn: async (userId: string, scheduleId: number): Promise<void> => {
    await staffClient.post('/api/reservations/walk-in', { userId, scheduleId });
  },

  getExercises: async (): Promise<Exercise[]> => {
    const response = await staffClient.get('/api/exercises');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  createRoutine: async (payload: {
    trainerId:      string;
    assignedUserId: number;
    exercises:      SelectedExercise[];
    routineName?:   string;
  }): Promise<void> => {
    await staffClient.post('/api/routines', {
      name:            payload.routineName?.trim() || 'Rutina personalizada',
      difficultyLevel: 'INTERMEDIO',
      trainerId:       parseInt(payload.trainerId, 10),
      assignedUserId:  payload.assignedUserId,
      exercises:       payload.exercises.map((ex, i) => ({
        exerciseId:              ex.exerciseId,
        orderPosition:           ex.orderPosition ?? i,
        dayOfWeek:               ex.dayOfWeek || undefined,
        setsRecommended:         ex.setsRecommended ?? undefined,
        repsRecommended:         ex.repsRecommended ?? undefined,
        weightRecommendedKg:     ex.weightRecommendedKg || undefined,
        restSecondsBetweenSets:  ex.restSecondsBetweenSets || undefined,
        notes:                   ex.notes || undefined,
        params:                  ex.params || undefined,
      })),
    });
  },

  /**
   * GET /api/staff/me/students (deduplicated by client)
   * Alumnos únicos de las clases del entrenador/instructor autenticado.
   */
  getClassStudents: async (): Promise<ClassStudent[]> => {
    const response = await staffClient.get('/api/staff/me/students');
    const raw = response.data?.data ?? response.data;
    const arr = Array.isArray(raw) ? raw : [];
    const map = new Map<number, { clientName: string; classCount: number }>();
    for (const r of arr) {
      const id = Number(r.clientId ?? 0);
      if (!id) continue;
      const existing = map.get(id);
      if (existing) { existing.classCount++; }
      else { map.set(id, { clientName: String(r.clientName ?? '—'), classCount: 1 }); }
    }
    return [...map.entries()].map(([clientId, { clientName, classCount }]) => ({
      clientId, clientName, classCount,
    }));
  },

  /**
   * GET /api/staff/advisors/my-requests
   * Solicitudes de asesoría enviadas por el cliente autenticado.
   */
  getMyAdvisorRequests: async (): Promise<AdvisorRequestStatus[]> => {
    const response = await staffClient.get('/api/staff/advisors/my-requests');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/staff/me/weekly-schedules
   * Todos los horarios del instructor en la semana (sin filtro por día).
   */
  getMyWeeklySchedules: async (): Promise<InstructorWeeklySchedule[]> => {
    const response = await staffClient.get('/api/staff/me/weekly-schedules');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/staff/me/stats/attendance
   * Historial de completadas por horario, últimos 30 días.
   */
  getMyAttendanceStats: async (): Promise<AttendanceStat[]> => {
    const response = await staffClient.get('/api/staff/me/stats/attendance');
    const raw = response.data?.data ?? response.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
      label: String(item.time ?? item.label ?? '—').slice(0, 5),
      value: Number(item.totalCompleted ?? item.value ?? 0),
    }));
  },

  /**
   * GET /api/staff/advisors/requests
   * Solicitudes PENDIENTES recibidas por el asesor (entrenador/nutricionista) autenticado.
   */
  getPendingTrainerRequests: async (): Promise<PendingTrainerRequest[]> => {
    const response = await staffClient.get('/api/staff/advisors/requests');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /** @deprecated use getPendingTrainerRequests */
  getPendingRequests: async (): Promise<AdvisorRequest[]> => {
    const response = await staffClient.get('/api/staff/advisors/requests');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  acceptAdvisorRequest: async (requestId: number): Promise<void> => {
    await staffClient.patch(`/api/staff/advisors/${requestId}/accept`);
  },

  rejectAdvisorRequest: async (requestId: number): Promise<void> => {
    await staffClient.patch(`/api/staff/advisors/${requestId}/reject`);
  },

  cancelAdvisorship: async (requestId: number): Promise<void> => {
    await staffClient.patch(`/api/staff/advisors/${requestId}/cancel`);
  },

  /**
   * GET /api/staff/advisors/active-clients
   * Clientes con relación ACTIVE con el asesor autenticado.
   */
  getActiveAdvisees: async (): Promise<ActiveAdvisee[]> => {
    const response = await staffClient.get('/api/staff/advisors/active-clients');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/staff/clients/:clientId
   * Perfil completo + últimas métricas del cliente (requiere relación ACTIVE).
   */
  getClientProfile: async (clientId: number): Promise<ClientProfile> => {
    const response = await staffClient.get(`/api/staff/clients/${clientId}`);
    return response.data?.data ?? response.data;
  },

  /**
   * POST /api/staff/clients/:clientId/plan
   * Crea o actualiza el plan nutricional del entrenador para el cliente.
   */
  upsertTrainerPlan: async (
    clientId: number,
    dto: { dailyKcal?: number; proteinG?: number; carbsG?: number; fatG?: number; planNotes?: string },
  ): Promise<TrainerPlanData> => {
    const response = await staffClient.post(`/api/staff/clients/${clientId}/plan`, dto);
    return response.data?.data ?? response.data;
  },

  /**
   * GET /api/staff/clients/:clientId/plan
   * Obtiene el plan nutricional guardado para el cliente.
   */
  getTrainerPlan: async (clientId: number): Promise<TrainerPlanData | null> => {
    try {
      const response = await staffClient.get(`/api/staff/clients/${clientId}/plan`);
      const data = response.data?.data ?? response.data;
      return data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * GET /api/staff/advisors/my-plan
   * Plan nutricional asignado por el asesor activo del cliente autenticado.
   */
  getMyPlan: async (): Promise<TrainerPlanData | null> => {
    try {
      const response = await staffClient.get('/api/staff/advisors/my-plan');
      const data = response.data?.data ?? response.data;
      return data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * PUT /api/routines/:routineId
   * Actualiza ejercicios de una rutina existente.
   */
  updateRoutine: async (routineId: number, payload: {
    exercises: SelectedExercise[];
  }): Promise<void> => {
    await staffClient.put(`/api/routines/${routineId}`, {
      exercises: payload.exercises.map((ex, i) => ({
        exerciseId:             ex.exerciseId,
        orderPosition:          ex.orderPosition ?? i,
        dayOfWeek:              ex.dayOfWeek || undefined,
        setsRecommended:        ex.setsRecommended ?? undefined,
        repsRecommended:        ex.repsRecommended ?? undefined,
        weightRecommendedKg:    ex.weightRecommendedKg || undefined,
        restSecondsBetweenSets: ex.restSecondsBetweenSets || undefined,
        notes:                  ex.notes || undefined,
        params:                 ex.params || undefined,
      })),
    });
  },

  /**
   * GET /api/routines/user/:userId
   * Rutinas asignadas al usuario (cliente).
   */
  getMyRoutines: async (userId: number): Promise<ClientRoutine[]> => {
    try {
      const response = await staffClient.get(`/api/routines/user/${userId}`);
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getCatalog: async (): Promise<StaffCatalogEntry[]> => {
    const response = await staffClient.get('/api/staff/catalog');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * POST /api/staff/advisors/request
   * Solicita asesoría a un miembro del staff.
   */
  requestAdvisor: async (staffId: number): Promise<void> => {
    await staffClient.post('/api/staff/advisors/request', { advisorId: Number(staffId) });
  },

  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const response = await staffClient.get('/api/users', {
      params: { search: query, limit: 10 },
    });
    const data = response.data?.data ?? response.data;
    if (!Array.isArray(data)) return [];
    return data.map((u: any) => ({
      id:       u.id,
      email:    u.email,
      fullName: (u.profile?.fullName
                ?? [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' '))
                || u.email
                || `#${u.id}`,
    }));
  },
};
