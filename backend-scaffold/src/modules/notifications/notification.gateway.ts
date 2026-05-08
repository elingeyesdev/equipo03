/**
 * NotificationGateway
 * -------------------
 * Gateway de WebSocket (Socket.io) para el sistema de notificaciones proactivas.
 *
 * Estrategia de Salas (Rooms):
 *   - room_gym_{gymId}  → GERENTE de esa sede específica
 *   - room_admin_all    → SUPER_ADMIN (visibilidad global)
 *
 * Seguridad:
 *   - El JWT es validado en el handshake (afterInit) antes de permitir
 *     cualquier emisión o suscripción a salas.
 *   - Basado en @nestjs/websockets con el adaptador de Socket.io.
 *
 * NOTA: Este archivo debe ser registrado en el módulo NestJS de Notifications.
 * Requiere instalación: npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

export interface SecurityAlertPayload {
  gymId: number;
  gymName: string;
  attemptedUserId: number;
  reason: string;
  timestamp: Date;
  isLive: true;
}

@Injectable()
@WebSocketGateway({
  path: '/notifications',
  cors: {
    origin: '*', // En producción: restringir al dominio específico
    credentials: true,
  },
  transports: ['websocket'],
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    console.log('[NotificationGateway]: Gateway inicializado y listo para conexiones WS.');

    // Middleware de autenticación en el handshake
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.warn('[NotificationGateway]: Conexión rechazada — Sin token JWT.');
        return next(new Error('UNAUTHORIZED: Token JWT requerido.'));
      }

      try {
        const payload = this.jwtService.verify(token);
        // Adjuntar datos del usuario al socket para uso posterior
        (socket as any).user = payload;
        next();
      } catch (err) {
        console.warn('[NotificationGateway]: Token inválido o expirado.', err.message);
        next(new Error('UNAUTHORIZED: Token inválido.'));
      }
    });
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    console.log(
      `[NotificationGateway]: Cliente conectado → ID: ${client.id} | Rol: ${user?.role} | GymId: ${user?.gymId}`
    );
  }

  handleDisconnect(client: Socket) {
    console.log(`[NotificationGateway]: Cliente desconectado → ID: ${client.id}`);
  }

  /**
   * Evento emitido por el cliente al conectarse.
   * Une al socket a la sala de su rol:
   *   - GERENTE     → room_gym_{gymId}
   *   - SUPER_ADMIN → room_admin_all
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; token: string }
  ) {
    const user = (client as any).user;

    if (!user) {
      client.disconnect(true);
      return;
    }

    let targetRoom: string;

    if (user.role === 'SUPER_ADMIN') {
      targetRoom = 'room_admin_all';
    } else if (user.role === 'GERENTE' && user.gymId) {
      targetRoom = `room_gym_${user.gymId}`;
    } else {
      console.warn(`[NotificationGateway]: Rol ${user.role} no autorizado para salas de alertas.`);
      client.disconnect(true);
      return;
    }

    // Seguridad: Verificar que el room solicitado coincida con el calculado del token
    if (data.room !== targetRoom) {
      console.warn(
        `[Security Guard]: BLOQUEO — Cliente ${user.userId} intentó unirse a sala ${data.room} pero corresponde a ${targetRoom}.`
      );
      client.disconnect(true);
      return;
    }

    client.join(targetRoom);
    console.log(`[NotificationGateway]: Usuario ${user.userId} unido a sala "${targetRoom}".`);
  }

  /**
   * Emite una alerta de seguridad en tiempo real.
   * Llamado por AccessDeniedEventHandler después de persistir en DB.
   *
   * @param gymId - ID de la sede afectada
   * @param payload - Datos del evento de acceso denegado
   */
  emitSecurityAlert(gymId: number, payload: SecurityAlertPayload) {
    const gymRoom = `room_gym_${gymId}`;

    console.log(
      `[NotificationGateway]: Emitiendo security_alert → Sala ${gymRoom} y room_admin_all`
    );

    // 1. Emitir a la sede específica (Gerente de esa sede)
    this.server.to(gymRoom).emit('security_alert', payload);

    // 2. Emitir al canal global de administradores
    this.server.to('room_admin_all').emit('security_alert', payload);
  }
}
