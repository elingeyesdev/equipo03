import { User } from '../../users/domain/user.entity';
import { Role } from './role.entity';
import { Gym } from '../../gyms/domain/gym.entity';
export declare class UserRole {
    id: number;
    userId: number;
    roleId: number;
    gymId: number;
    assignedAt: Date;
    assignedBy: number;
    expiresAt: Date;
    user: User;
    role: Role;
    gym: Gym;
    assignedByUser: User;
}
