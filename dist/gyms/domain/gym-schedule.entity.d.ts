import { Gym } from './gym.entity';
export declare class GymSchedule {
    id: number;
    gymId: number;
    dayOfWeek: string;
    opensAt: string;
    closesAt: string;
    isHoliday: boolean;
    gym: Gym;
}
