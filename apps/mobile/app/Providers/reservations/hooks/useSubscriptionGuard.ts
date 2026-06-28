import { useQuery } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';

export const useSubscriptionGuard = () => {
  const { data: subscription, isLoading, isError } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: reservationApi.getSubscriptionStatus,
    staleTime: 1000 * 60 * 5, // Cache the status for 5 minutes
  });

  const today = new Date();
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  
  const isActive = 
    subscription?.status === 'ACTIVO' && 
    !!endDate && 
    endDate >= today;

  return { 
    isActive, 
    canReserve: isActive, 
    subscription,
    isLoading,
    isError
  };
};
