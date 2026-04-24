import { Reservation } from '../../reservations/domain/reservation.entity';
import { User } from '../../users/domain/user.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
export declare class WaitlistEntry {
    id: number;
    reservationId: number;
    userId: number;
    gymActivityScheduleId: number;
    positionInQueue: number;
    status: string;
    notifiedAt: Date;
    assignedAt: Date;
    createdAt: Date;
    reservation: Reservation;
    user: User;
    gymActivitySchedule: GymActivitySchedule;
}
