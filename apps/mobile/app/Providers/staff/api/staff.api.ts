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

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StaffClass = {
  id:           number;
  activityName: string;
  startTime:    string;   // HH:mm
  endTime:      string;   // HH:mm
  enrolledCount: number;
  maxAttendees?: number;
  location?:    string;
  status?:      string;
};

export type StaffAppointment = {
  id:          number;
  startTime:   string;   // HH:mm
  endTime:     string;   // HH:mm
  patientName: string;
  notes?:      string;
  status?:     string;
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
};
