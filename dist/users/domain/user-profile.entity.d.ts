import { User } from './user.entity';
export declare class UserProfile {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    user: User;
}
