import { GymActivitySchedule } from './gym-activity-schedule.entity';
import { User } from '../../users/domain/user.entity';
export declare class GymActivityAttendance {
    id: number;
    gymActivityScheduleId: number;
    userId: number;
    checkInTime: Date;
    checkOutTime: Date;
    status: string;
    gymActivitySchedule: GymActivitySchedule;
    user: User;
}
