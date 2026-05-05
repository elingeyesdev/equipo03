import { Notification } from '../../../domain/entities/Notification.entity';

export interface INotificationsRepository {
  create(notification: Notification): Promise<Notification>;
}

export const INotificationsRepository = Symbol('INotificationsRepository');
