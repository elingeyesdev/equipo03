/**
 * Módulo de Notificaciones
 * ------------------------
 * Registra el NotificationGateway en el ecosistema NestJS.
 * Requiere JwtModule para la validación de tokens en el handshake.
 *
 * Registro en AppModule:
 *   imports: [NotificationsModule, ...]
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'gymsync_secret_dev',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [NotificationGateway],
  exports: [NotificationGateway], // Exportar para que AccessDeniedEventHandler lo inyecte
})
export class NotificationsModule {}
