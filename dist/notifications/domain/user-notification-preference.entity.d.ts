import { User } from '../../users/domain/user.entity';
export declare class UserNotificationPreference {
    id: number;
    userId: number;
    enablePush: boolean;
    reservationConfirmations: boolean;
    classReminders: boolean;
    cancellationsAlerts: boolean;
    promotionalContent: boolean;
    updatedAt: Date;
    user: User;
}
