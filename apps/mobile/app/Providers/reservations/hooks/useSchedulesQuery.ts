import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { ScheduleSlot } from '../api/reservation.types';

export interface ScheduleSlotUI extends ScheduleSlot {
  availableSlots: number;
  isAvailable: boolean;
}

export const useSchedulesQuery = (activityId: number | undefined, date: string | undefined) => {
  return useQuery({
    queryKey: ['schedules', activityId, date],
    queryFn: () => reservationApi.getSchedules(activityId!, date!),
    enabled: !!activityId && !!date,
    staleTime: 1000 * 60 * 2, // Frescura de 2 minutos
    select: (data): ScheduleSlotUI[] => {
      return data.map(slot => {
        // Cálculo de cupos en el cliente
        const availableSlots = Math.max(0, slot.maxAttendees - slot.activeReservations);
        return {
          ...slot,
          availableSlots,
          isAvailable: availableSlots > 0,
        };
      });
    },
  });
};
