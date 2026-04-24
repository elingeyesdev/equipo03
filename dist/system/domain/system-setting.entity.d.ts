import { User } from '../../users/domain/user.entity';
export declare class SystemSetting {
    id: number;
    settingKey: string;
    settingValue: any;
    description: string;
    updatedAt: Date;
    updatedBy: number;
    updatedByUser: User;
}
