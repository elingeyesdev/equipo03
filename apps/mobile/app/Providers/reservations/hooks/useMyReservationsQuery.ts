import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { UserReservation } from '../api/reservation.types';
import { useAuth } from '../../../Shared/hooks/useAuth';

export const useMyReservationsQuery = (refetchInterval?: number) => {
  const { user } = useAuth();
  const isCliente = ((user as any)?.level ?? 0) <= 2;

  return useQuery<UserReservation[]>({
    queryKey: ['my-reservations', user?.userId],
    queryFn: () => reservationApi.getMyReservations(),
    enabled: !!user && isCliente,
    staleTime: 1000 * 60,
    retry: 1,
    refetchInterval,
  });
};
