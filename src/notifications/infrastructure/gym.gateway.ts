import { Logger } from '@nestjs/common';
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

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/events',
})
export class GymGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GymGateway.name);

  constructor(private readonly authService: AuthService) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ??
      (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

    const payload = token ? this.authService.verifyToken(token) : null;

    if (!payload) {
      client.disconnect();
      return;
    }

    client.data.userId = payload.sub;
    client.data.role = payload.role?.toUpperCase() ?? null;
    client.data.gymId = payload.gymId;

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
