import { Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../auth/application/auth.service';

/** Parsea el header 'cookie' del handshake y extrae el valor de 'access_token'. */
function extractTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

@SkipThrottle()
@WebSocketGateway({
  // origin: true refleja el origen para soportar credenciales (cookies)
  cors: { origin: true, credentials: true },
  namespace: '/events',
})
export class GymGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GymGateway.name);

  constructor(private readonly authService: AuthService) {}

  handleConnection(client: Socket) {
    try {
      // Prioridad de extracción del token:
      // 1. Cookie HttpOnly del handshake (producción — withCredentials: true)
      // 2. auth.token del handshake (compatibilidad hacia atrás durante migración)
      // 3. Authorization header (Postman / herramientas de desarrollo)
      const cookieToken = extractTokenFromCookie(
        client.handshake.headers?.cookie as string,
      );
      const authToken = client.handshake.auth?.token as string | undefined;
      const headerToken = (client.handshake.headers?.authorization as string)
        ?.replace('Bearer ', '');

      const token = cookieToken ?? authToken ?? headerToken ?? null;
      const payload = token ? this.authService.verifyToken(token) : null;

      if (!payload) {
        this.logger.warn(`[WS] Conexión rechazada — token inválido o ausente (id: ${client.id})`);
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.role   = payload.role?.toUpperCase() ?? null;
      client.data.gymId  = payload.gymId;

      const role = client.data.role;

      if (role === 'GERENTE' && payload.gymId) {
        client.join(`gym_${payload.gymId}`);
        this.logger.log(`GERENTE userId=${payload.sub} → sala gym_${payload.gymId}`);
      } else if (role === 'SUPER_ADMIN') {
        client.join('admin_room');
        this.logger.log(`SUPER_ADMIN userId=${payload.sub} → admin_room`);
      } else {
        client.join(`user_${payload.sub}`);
      }
    } catch (error: any) {
      this.logger.error(`[WS] Error en handleConnection: ${error?.message}`, error?.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }

  /** Emite evento a la sala de una sede específica. */
  emitToGym(gymId: number, event: string, data: unknown) {
    this.server.to(`gym_${gymId}`).emit(event, data);
  }

  /** Emite evento a todos los SUPER_ADMIN conectados. */
  emitToAdmins(event: string, data: unknown) {
    this.server.to('admin_room').emit(event, data);
  }

  /** Emite evento a un usuario concreto. */
  emitToUser(userId: number, event: string, data: unknown) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: unknown) {
    client.emit('pong', { ts: Date.now(), echo: data });
  }
}
