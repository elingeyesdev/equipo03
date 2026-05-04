import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { CreateReservationPayload } from '../api/reservation.types';

export const useCreateReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationApi.createReservation(payload),
    onSuccess: () => {
      // Invalidar caché para que MisReservas se refresque automáticamente
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['gym-activities'] });
    },
  });
};
