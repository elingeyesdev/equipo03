import { ActivitiesService } from '../application/activities.service';
import { CreateActivityDto, CreateActivityScheduleDto, RegisterAttendanceDto } from '../application/dtos/activities.dto';
export declare class ActivitiesController {
    private readonly svc;
    constructor(svc: ActivitiesService);
    create(body: CreateActivityDto): Promise<import("../domain/gym-activity.entity").GymActivity>;
    findAll(gymId?: number): Promise<import("../domain/gym-activity.entity").GymActivity[]>;
    findOne(id: number): Promise<import("../domain/gym-activity.entity").GymActivity>;
    createSchedule(id: number, body: CreateActivityScheduleDto): Promise<import("../domain/gym-activity-schedule.entity").GymActivitySchedule>;
    findSchedules(id: number): Promise<import("../domain/gym-activity-schedule.entity").GymActivitySchedule[]>;
    registerAttendance(sid: number, body: RegisterAttendanceDto): Promise<import("../domain/gym-activity-attendance.entity").GymActivityAttendance>;
    findAttendances(sid: number): Promise<import("../domain/gym-activity-attendance.entity").GymActivityAttendance[]>;
}
