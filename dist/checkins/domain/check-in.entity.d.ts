import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
export declare class CheckIn {
    id: number;
    userId: number;
    gymId: number;
    checkInTime: Date;
    checkOutTime: Date;
    method: string;
    status: string;
    user: User;
    gym: Gym;
}
