/**
 * useNotifications Hook
 * ---------------------
 * Establece un canal WebSocket persistente con el backend (Socket.io).
 * Estrategia de Salas (Rooms):
 *   - GERENTE     → room_gym_{gymId}   (aislamiento estricto por sede)
 *   - SUPER_ADMIN → room_admin_all     (visibilidad global)
 *
 * Al recibir el evento 'security_alert', dispara un Toast proactivo.
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export interface SecurityAlertPayload {
  gymId: number;
  gymName: string;
  attemptedUserId: number;
  reason: string;
  timestamp: string;
  isLive: true; // Flag para diferenciar de notificaciones históricas de DB
}

export const useNotifications = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('gymsync_token');
    if (!token) return;

    // Solo roles con acceso al módulo de auditoría reciben el socket
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'GERENTE') return;

    console.log(`[NotificationGateway]: Iniciando conexión WS para rol ${user.role}...`);

    // Usar el mismo origen que la web (pasa por el proxy de Vite → puerto 3000)
    const BASE_URL = import.meta.env.VITE_API_URL ?? window.location.origin;
    const SOCKET_URL = `${BASE_URL}/events`;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: false,
    });

    socketRef.current = socket;

    let isMounted = true;

    // Conectar en el siguiente tick — si el cleanup llega primero (StrictMode),
    // isMounted=false y nunca abrimos el WebSocket, sin error.
    const connectTimer = setTimeout(() => {
      if (!isMounted) return;
      socket.connect();
    }, 0);

    socket.on('connect', () => {
      console.log(`[NotificationGateway]: Conexión establecida. Socket ID: ${socket.id}`);

      // Unirse a la sala correspondiente según rol
      if (user.role === 'GERENTE' && user.gymId) {
        const room = `gym_${user.gymId}`;
        socket.emit('join_room', { room, token });
        console.log(`[NotificationGateway]: GERENTE unido a sala: ${room}`);
      } else if (user.role === 'SUPER_ADMIN') {
        socket.emit('join_room', { room: 'admin_room', token });
        console.log(`[NotificationGateway]: SUPER_ADMIN unido a sala: admin_room`);
      }
    });

    // --- Listener del Evento Principal ---
    socket.on('security_alert', (payload: SecurityAlertPayload) => {
      console.warn(
        `[SecurityAlert LIVE]: Acceso denegado en ${payload.gymName} | Usuario ${payload.attemptedUserId} | ${payload.reason}`
      );

      // Validación de privacidad de Gerente: Descarta alertas de otras sedes
      if (user.role === 'GERENTE' && user.gymId && String(payload.gymId) !== String(user.gymId)) {
        console.warn(
          `[Security Guard]: Alerta de Sede ajena descartada para Gerente ID ${user.id}. Sede recibida: ${payload.gymId}`
        );
        return;
      }

      // Toast proactivo con sonido y duración prolongada
      toast.error(
        ` Alerta de Seguridad\nAcceso denegado a Usuario ${payload.attemptedUserId}\nen sede "${payload.gymName}"`,
        {
          duration: 10000,
          style: {
            background: '#1C1C1E',
            color: '#fff',
            border: '2px solid #FF5E00',
            whiteSpace: 'pre-wrap',
            maxWidth: '380px',
          },
          icon: '🚨',
        }
      );
    });

    socket.on('connect_error', (err) => {
      console.warn(`[NotificationGateway]: Error de conexión WS -`, err.message);
      // No bloquear la UI si el WS no está disponible
    });

    socket.on('disconnect', (reason) => {
      console.log(`[NotificationGateway]: Desconectado. Razón: ${reason}`);
    });

    return () => {
      isMounted = false;
      clearTimeout(connectTimer);
      console.log('[NotificationGateway]: Limpiando conexión WS...');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, user?.role, user?.gymId]);

  return socketRef;
};
