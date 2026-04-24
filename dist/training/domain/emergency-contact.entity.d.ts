import { User } from '../../users/domain/user.entity';
export declare class EmergencyContact {
    id: number;
    userId: number;
    fullName: string;
    phone: string;
    relation: string;
    isPrimary: boolean;
    user: User;
}
