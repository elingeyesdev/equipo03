import { Gym } from '../../gyms/domain/gym.entity';
import { GymActivitySchedule } from './gym-activity-schedule.entity';
export declare class GymActivity {
    id: number;
    gymId: number;
    name: string;
    description: string;
    defaultDurationMin: number;
    isActive: boolean;
    gym: Gym;
    schedules: GymActivitySchedule[];
}
