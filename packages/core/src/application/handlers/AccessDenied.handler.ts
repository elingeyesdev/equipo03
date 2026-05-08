import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AccessDeniedDomainEvent } from '../../domain/events/AccessDenied.event';
import { INotificationsRepository } from '../ports/output/INotificationsRepository';
import { IUserRolesRepository } from '../ports/output/IUserRolesRepository';
import { Notification } from '../../domain/entities/Notification.entity';

// NOTA: En la implementación real del backend NestJS, este import proviene del
// módulo de infraestructura de notificaciones. Se declara aquí como contrato.
// import { NotificationGateway } from '../../../infrastructure/gateways/notification.gateway';

/**
 * Puerto de interfaz para el Gateway de Notificaciones.
 * Permite desacoplar el handler del módulo de infraestructura de WebSockets.
 */
export const INotificationGateway = Symbol('INotificationGateway');
export interface INotificationGateway {
  emitSecurityAlert(gymId: number, payload: {
    gymId: number;
    gymName: string;
    attemptedUserId: number;
    reason: string;
    timestamp: Date;
    isLive: true;
  }): void;
}

@EventsHandler(AccessDeniedDomainEvent)
export class AccessDeniedEventHandler implements IEventHandler<AccessDeniedDomainEvent> {
  constructor(
    @Inject(INotificationsRepository) private notificationsRepo: INotificationsRepository,
    @Inject(IUserRolesRepository) private userRolesRepo: IUserRolesRepository,
    @Inject(INotificationGateway) private notificationGateway: INotificationGateway,
  ) {}

  async handle(event: AccessDeniedDomainEvent) {
    // 1. Buscar al gerente del gimnasio en user_roles
    const gerenteId = await this.userRolesRepo.findManagerByGymId(event.gymId);

    if (!gerenteId) {
      console.warn(`[AccessDeniedHandler]: No se encontró gerente para gymId ${event.gymId}.`);
      return;
    }

    // 2. Construir el payload del evento en tiempo real (con flag isLive)
    const alertPayload = {
      gymId: event.gymId,
      gymName: event.gymName,
      attemptedUserId: event.attemptedUserId,
      reason: event.reason,
      timestamp: event.timestamp,
      isLive: true as const,
    };

    // 3. Emitir en tiempo real vía WebSocket ANTES de persistir en DB
    //    (Se emite primero para máxima inmediatez; la DB es el registro permanente)
    this.notificationGateway.emitSecurityAlert(event.gymId, alertPayload);
    console.log(
      `[AccessDeniedHandler]: security_alert emitida en tiempo real para gymId ${event.gymId}.`
    );

    // 4. Persistir el registro en la tabla notifications (log histórico)
    const notification = new Notification({
      userId: gerenteId,
      title: 'Alerta de Seguridad',
      message: `Intento de acceso no autorizado en ${event.gymName} por usuario ${event.attemptedUserId}`,
      type: 'SECURITY_ALERT',
      isRead: false,
      createdAt: new Date(),
    });

    await this.notificationsRepo.create(notification);
    console.log(
      `[AccessDeniedHandler]: Notificación persistida en DB para gerente ${gerenteId}.`
    );
  }
}

