import { User } from '../../users/domain/user.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
export declare class Reservation {
    id: number;
    userId: number;
    gymActivityScheduleId: number;
    reservationDate: Date;
    status: string;
    createdAt: Date;
    cancelledAt: Date;
    user: User;
    gymActivitySchedule: GymActivitySchedule;
}
