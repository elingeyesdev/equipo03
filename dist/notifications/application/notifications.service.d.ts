import { Repository } from 'typeorm';
import { NotificationTemplate } from '../domain/notification-template.entity';
import { Notification } from '../domain/notification.entity';
import { UserNotificationPreference } from '../domain/user-notification-preference.entity';
export declare class NotificationsService {
    private templatesRepo;
    private notifRepo;
    private prefsRepo;
    constructor(templatesRepo: Repository<NotificationTemplate>, notifRepo: Repository<Notification>, prefsRepo: Repository<UserNotificationPreference>);
    createTemplate(data: Partial<NotificationTemplate>): Promise<NotificationTemplate>;
    findAllTemplates(): Promise<NotificationTemplate[]>;
    send(data: Partial<Notification>): Promise<Notification>;
    findByUser(userId: number): Promise<Notification[]>;
    markAsRead(id: number): Promise<Notification | null>;
    getPreferences(userId: number): Promise<UserNotificationPreference>;
    updatePreferences(userId: number, data: any): Promise<UserNotificationPreference>;
}
