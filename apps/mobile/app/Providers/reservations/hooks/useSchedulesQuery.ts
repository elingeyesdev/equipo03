import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { GymActivitySchedule } from '../api/reservation.types';

export interface ScheduleSlotUI extends GymActivitySchedule {
  availableSlots: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  instructorName?: string;
}

export const useSchedulesQuery = (activityId: number | undefined, date: string | undefined) => {
  return useQuery({
    queryKey: ['schedules', activityId, date],
    queryFn: () => reservationApi.getActivitySchedules(activityId!),
    enabled: !!activityId && !!date,
    staleTime: 1000 * 60 * 2, // Frescura de 2 minutos
    select: (data): ScheduleSlotUI[] => {
      const list: any[] = Array.isArray(data) ? data : [];
      return list.map((slot: any) => {
        const maxAttendees = slot.maxAttendees ?? 0;
        const activeReservations = slot.activeReservations ?? 0;
        const availableSlots = Math.max(0, maxAttendees - activeReservations);
        return {
          ...slot,
          availableSlots,
          isAvailable: availableSlots > 0,
          startTime: slot.startTime ?? '',
          endTime: slot.endTime ?? '',
        };
      });
    },
  });
};
