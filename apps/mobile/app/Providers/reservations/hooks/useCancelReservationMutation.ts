import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { Alert } from 'react-native';

export const useCancelReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: number) => reservationApi.cancelReservation(reservationId),
    onSuccess: () => {
      // Invalidar la lista de reservas para que se refresque sola
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      Alert.alert('Éxito', 'La reserva ha sido cancelada correctamente.');
    },
    onError: (error: any) => {
      console.error('[Cancelación] Error:', error);
      Alert.alert('Error', 'No se pudo cancelar la reserva. Inténtalo de nuevo más tarde.');
    },
  });
};
