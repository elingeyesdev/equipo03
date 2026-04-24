import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
export declare class PhysicalMetricsHistory {
    id: number;
    userId: number;
    recordedAt: Date;
    gymId: number;
    weightKg: number;
    bodyFatPercentage: number;
    muscleMassKg: number;
    waistCm: number;
    chestCm: number;
    notes: string;
    user: User;
    gym: Gym;
}
