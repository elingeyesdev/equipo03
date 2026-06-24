import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { GymActivity, GymActivitySchedule, DayOfWeek } from '../api/reservation.types';

// Nombres de día del backend (completo) → label formateado en español
export const DAY_LABELS: Record<string, string> = {
  LUNES: 'Lunes',     LUN: 'Lunes',
  MARTES: 'Martes',   MAR: 'Martes',
  MIERCOLES: 'Miércoles', MIE: 'Miércoles',
  JUEVES: 'Jueves',   JUE: 'Jueves',
  VIERNES: 'Viernes', VIE: 'Viernes',
  SABADO: 'Sábado',   SAB: 'Sábado',
  DOMINGO: 'Domingo', DOM: 'Domingo',
};

// Actividad enriquecida para la UI
export interface GymActivityUI extends GymActivity {
  availableSchedule: GymActivitySchedule | null;
  availableDayLabel: string;
}

export const useGymActivitiesQuery = (gymId: number | undefined) => {
  return useQuery({
    queryKey: ['gym-activities', gymId],
    queryFn: async (): Promise<GymActivityUI[]> => {
      if (!gymId) return [];

      // 1. Obtener actividades del gimnasio (devuelve GymActivity[] plano)
      const activitiesList: GymActivity[] = await reservationApi.getGymActivities(gymId);

      // 2. Para cada actividad, si no trae schedules embebidos, los pedimos por separado
      const enriched = await Promise.all(
        activitiesList.map(async (activity) => {
          // Lectura defensiva: el backend puede usar 'schedules' o 'gymActivitySchedules'
          let schedules: GymActivitySchedule[] =
            (activity as any).gymActivitySchedules ??
            activity.schedules ??
            [];

          if (schedules.length === 0 && activity.isFreeAccess !== true) {
            // Solo buscar horarios separados si la actividad es programada
            try {
              schedules = await reservationApi.getActivitySchedules(activity.id);
            } catch {
              schedules = [];
            }
          }

          const schedule = schedules[0] ?? null;
          return {
            ...activity,
            schedules,
            availableSchedule: schedule,
            availableDayLabel: schedule ? (DAY_LABELS[schedule.dayOfWeek] ?? schedule.dayOfWeek) : '',
          };
        })
      );

      return enriched;
    },
    enabled: !!gymId,
    staleTime: 0,
    refetchOnMount: true,
    retry: 1,
  });
};
