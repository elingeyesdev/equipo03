import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { UserReservation } from '../api/reservation.types';

export const useMyReservationsQuery = () => {
  return useQuery<UserReservation[]>({
    queryKey: ['my-reservations'],
    queryFn: () => reservationApi.getMyReservations(),
    staleTime: 1000 * 60, // 1 minuto
    retry: 1,
  });
};
