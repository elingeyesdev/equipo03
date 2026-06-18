import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { Env } from '../geolocation/config/environment';
import { AuthService } from '../auth/AuthService';
import { authEvents } from '../auth/authEvents';
import { useAuth } from '../../Shared/hooks/useAuth';

const MANAGER_ROLES  = new Set(['GERENTE', 'SUPER_ADMIN']);
const TRAINER_ROLES  = new Set(['ENTRENADOR', 'INSTRUCTOR', 'NUTRICIONISTA']);

type GymEventPayload = {
  message?: string;
  reservationId?: number;
  scheduleId?: number;
  gymId?: number;
};

async function showLocalGymNotification(
  event: 'new_reservation' | 'cancel_reservation',
  payload: GymEventPayload,
): Promise<void> {
  const isNew = event === 'new_reservation';
  const title = isNew ? 'Nueva Reserva' : 'Reserva Cancelada';
  const body =
    payload.message ??
    (isNew
      ? 'Un cliente acaba de reservar un cupo en tu sucursal.'
      : 'Un cliente ha cancelado su reserva, se ha liberado un cupo.');

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: isNew ? 'NEW_RESERVATION' : 'CANCEL_RESERVATION',
          reservationId: payload.reservationId,
          scheduleId: payload.scheduleId,
          gymId: payload.gymId,
        },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[GymEvents] local notification error:', e);
  }
}

function invalidateManagerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  reservationId?: number,
): void {
  queryClient.invalidateQueries({ queryKey: ['gym-audit-reservations'] });
  queryClient.invalidateQueries({ queryKey: ['manager-dashboard-stats'] });

  if (reservationId != null) {
    queryClient.setQueriesData<any[]>(
      { queryKey: ['gym-audit-reservations'] },
      (old) => (Array.isArray(old) ? old.filter((r) => r?.id !== reservationId) : old),
    );
  }
}

export function useGymEventsSocket(): void {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const role = user?.role?.toUpperCase() ?? '';
  const shouldConnect = isAuthenticated && (MANAGER_ROLES.has(role) || TRAINER_ROLES.has(role));

  useEffect(() => {
    if (!shouldConnect) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    let cancelled = false;

    const connect = async () => {
      const token = await AuthService.getToken();
      if (!token || cancelled) return;

      const socket = io(`${Env.API_BASE_URL}/events`, {
        auth: { token: token.trim() },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        const trimmedToken = token.trim();
        if (role === 'GERENTE' && user?.gymId) {
          socket.emit('join_room', { room: `gym_${user.gymId}`, token: trimmedToken });
        } else if (role === 'SUPER_ADMIN') {
          socket.emit('join_room', { room: 'admin_room', token: trimmedToken });
        }
      });

      socket.on('disconnect', () => {});

      socket.on('connect_error', (err) => {
        console.warn('[GymEvents] connect_error:', err.message);
      });

      const handleReservationEvent = async (
        event: 'new_reservation' | 'cancel_reservation',
        payload: GymEventPayload,
      ) => {
        invalidateManagerQueries(queryClient, payload?.reservationId);
        await showLocalGymNotification(event, payload ?? {});
      };

      socket.on('new_reservation', (payload: GymEventPayload) => {
        void handleReservationEvent('new_reservation', payload ?? {});
      });

      socket.on('cancel_reservation', (payload: GymEventPayload) => {
        void handleReservationEvent('cancel_reservation', payload ?? {});
      });

      if (TRAINER_ROLES.has(role)) {
        socket.on('routine_session_update', (payload: any) => {
          const userId = payload?.userId ?? payload?.user?.id;
          if (userId != null) {
            queryClient.invalidateQueries({ queryKey: ['trainer-client-sessions', userId] });
          }
          queryClient.invalidateQueries({ queryKey: ['trainer-client-sessions'] });
        });
      }
    };

    void connect();

    const offLogout = authEvents.onForceLogout(() => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    });

    return () => {
      cancelled = true;
      offLogout();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [shouldConnect, queryClient]);
}
