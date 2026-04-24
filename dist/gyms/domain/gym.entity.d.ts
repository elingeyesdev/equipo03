import { GymLocation } from './gym-location.entity';
import { GymSchedule } from './gym-schedule.entity';
import { GymActivity } from '../../activities/domain/gym-activity.entity';
export declare class Gym {
    id: number;
    name: string;
    description: string;
    maxCapacity: number;
    isActive: boolean;
    isOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
    location: GymLocation;
    schedules: GymSchedule[];
    activities: GymActivity[];
}
