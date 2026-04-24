import { GymActivity } from './gym-activity.entity';
import { User } from '../../users/domain/user.entity';
import { GymActivityAttendance } from './gym-activity-attendance.entity';
export declare class GymActivitySchedule {
    id: number;
    gymActivityId: number;
    instructorId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    maxAttendees: number;
    isRecurring: boolean;
    gymActivity: GymActivity;
    instructor: User;
    attendances: GymActivityAttendance[];
}
