import { Repository } from 'typeorm';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class ActivitiesService {
    private actRepo;
    private schedRepo;
    private attRepo;
    private readonly request;
    constructor(actRepo: Repository<GymActivity>, schedRepo: Repository<GymActivitySchedule>, attRepo: Repository<GymActivityAttendance>, request: RequestWithUser);
    private managerGymId;
    private resolveListGymFilter;
    createActivity(data: Partial<GymActivity>): Promise<GymActivity>;
    findAllActivities(gymId?: number): Promise<GymActivity[]>;
    findOneActivity(id: number): Promise<GymActivity>;
    private assertActivityInManagerScope;
    private assertScheduleInManagerScope;
    createSchedule(data: Partial<GymActivitySchedule>): Promise<GymActivitySchedule>;
    findSchedulesByActivity(gymActivityId: number): Promise<GymActivitySchedule[]>;
    registerAttendance(data: Partial<GymActivityAttendance>): Promise<GymActivityAttendance>;
    findAttendances(gymActivityScheduleId: number): Promise<GymActivityAttendance[]>;
}
