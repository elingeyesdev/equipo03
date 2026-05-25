import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { UserReservation } from '../api/reservation.types';
import { Alert } from 'react-native';

export const useCancelReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: number) => reservationApi.cancelReservation(reservationId),

    onMutate: async (reservationId) => {
      await queryClient.cancelQueries({ queryKey: ['my-reservations'] });
      const prev = queryClient.getQueryData<UserReservation[]>(['my-reservations']);
      queryClient.setQueryData<UserReservation[]>(['my-reservations'], (old = []) =>
        old.filter((r) => r.id !== reservationId)
      );
      return { prev };
    },

    onError: (err: any, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['my-reservations'], ctx.prev);
      const message = err?.response?.data?.message ?? 'No se pudo cancelar la reserva.';
      Alert.alert('Error', message);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
  });
};
