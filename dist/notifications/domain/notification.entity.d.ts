import { User } from '../../users/domain/user.entity';
import { NotificationTemplate } from './notification-template.entity';
export declare class Notification {
    id: number;
    userId: number;
    templateId: number;
    title: string;
    body: string;
    sentAt: Date;
    readAt: Date;
    status: string;
    user: User;
    template: NotificationTemplate;
}
