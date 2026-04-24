import { NotificationsService } from '../application/notifications.service';
import { CreateTemplateDto, SendNotificationDto, UpdatePreferencesDto } from '../application/dtos/notifications.dto';
export declare class NotificationsController {
    private readonly svc;
    constructor(svc: NotificationsService);
    createTemplate(body: CreateTemplateDto): Promise<import("../domain/notification-template.entity").NotificationTemplate>;
    findTemplates(): Promise<import("../domain/notification-template.entity").NotificationTemplate[]>;
    send(body: SendNotificationDto): Promise<import("../domain/notification.entity").Notification>;
    findByUser(uid: number): Promise<import("../domain/notification.entity").Notification[]>;
    markRead(id: number): Promise<import("../domain/notification.entity").Notification | null>;
    getPrefs(uid: number): Promise<import("../domain/user-notification-preference.entity").UserNotificationPreference>;
    updatePrefs(uid: number, body: UpdatePreferencesDto): Promise<import("../domain/user-notification-preference.entity").UserNotificationPreference>;
}
