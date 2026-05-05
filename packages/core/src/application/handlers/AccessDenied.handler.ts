import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AccessDeniedDomainEvent } from '../../domain/events/AccessDenied.event';
import { INotificationsRepository } from '../ports/output/INotificationsRepository';
import { IUserRolesRepository } from '../ports/output/IUserRolesRepository';
import { Notification } from '../../domain/entities/Notification.entity';

@EventsHandler(AccessDeniedDomainEvent)
export class AccessDeniedEventHandler implements IEventHandler<AccessDeniedDomainEvent> {
  constructor(
    @Inject(INotificationsRepository) private notificationsRepo: INotificationsRepository,
    @Inject(IUserRolesRepository) private userRolesRepo: IUserRolesRepository,
  ) {}

  async handle(event: AccessDeniedDomainEvent) {
    // 1. Buscar al gerente del gimnasio en user_roles
    // Asumimos que el gerente está asociado al gymId
    const gerenteId = await this.userRolesRepo.findManagerByGymId(event.gymId);

    if (!gerenteId) {
      console.warn(`No se encontró gerente para el gimnasio ${event.gymId} para notificar.`);
      return;
    }

    // 2. Insertar el registro en notifications
    const notification = new Notification({
      userId: gerenteId,
      title: 'Alerta de Seguridad',
      message: `Intento de acceso no autorizado en ${event.gymName}`,
      type: 'SECURITY_ALERT',
      isRead: false,
      createdAt: new Date(),
    });

    await this.notificationsRepo.create(notification);
  }
}
