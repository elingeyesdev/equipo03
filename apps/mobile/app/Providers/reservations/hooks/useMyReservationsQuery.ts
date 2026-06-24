import { useInfiniteQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { UserReservation } from '../api/reservation.types';
import { useAuth } from '../../../Shared/hooks/useAuth';

export const useMyReservationsQuery = (refetchInterval?: number) => {
  const { user } = useAuth();
  const isCliente = ((user as any)?.level ?? 0) <= 2;

  return useInfiniteQuery({
    queryKey: ['my-reservations', user?.userId],
    queryFn: ({ pageParam = 0 }) => reservationApi.getMyReservations({ limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      const nextOffset = lastPage.meta.offset + lastPage.meta.limit;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
    enabled: !!user && isCliente,
    staleTime: 1000 * 60,
    retry: 1,
    refetchInterval,
  });
};
