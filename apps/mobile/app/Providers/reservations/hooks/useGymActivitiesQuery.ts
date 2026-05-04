import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { GymActivity, GymActivitySchedule, DayOfWeek } from '../api/reservation.types';

// Mapa de abreviaturas del backend a nombre completo en español
export const DAY_LABELS: Record<DayOfWeek, string> = {
  LUN: 'Lunes',
  MAR: 'Martes',
  MIE: 'Miércoles',
  JUE: 'Jueves',
  VIE: 'Viernes',
  SAB: 'Sábado',
  DOM: 'Domingo',
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

      // 1. Obtener actividades del gimnasio
      const activities = await reservationApi.getGymActivities(gymId);

      // 2. Para cada actividad, si no trae schedules embebidos, los pedimos por separado
      const enriched = await Promise.all(
        activities.map(async (activity) => {
          let schedules: GymActivitySchedule[] = activity.schedules ?? [];

          if (schedules.length === 0) {
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

      return enriched.filter((a) => a.availableSchedule !== null);
    },
    enabled: !!gymId,
    staleTime: 1000 * 60 * 5, // 5 min de caché
    retry: 1,
  });
};
