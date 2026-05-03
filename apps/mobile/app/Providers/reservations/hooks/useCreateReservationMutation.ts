import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { CreateReservationPayload } from '../api/reservation.types';

export const useCreateReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationPayload) => reservationApi.createReservation(payload),
    onSuccess: () => {
      // Magia de React Query: Cuando la reserva tiene éxito, 
      // invalidamos la caché para que se refresquen los horarios y la UI de cupos.
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
  });
};
