import { GymsService } from '../application/gyms.service';
import { CreateGymDto, UpdateGymDto, CreateGymScheduleInputDto, UpdateGymLocationDto } from '../application/dtos/gyms.dto';
export declare class GymsController {
    private readonly svc;
    constructor(svc: GymsService);
    create(body: CreateGymDto): Promise<import("../domain/gym.entity").Gym>;
    findAll(): Promise<import("../domain/gym.entity").Gym[]>;
    findOne(id: number): Promise<import("../domain/gym.entity").Gym>;
    update(id: number, body: UpdateGymDto): Promise<import("../domain/gym.entity").Gym>;
    remove(id: number): Promise<{
        message: string;
    }>;
    addSchedule(id: number, body: CreateGymScheduleInputDto): Promise<import("../domain/gym-schedule.entity").GymSchedule[]>;
    findSchedules(id: number): Promise<import("../domain/gym-schedule.entity").GymSchedule[]>;
    updateLocation(id: number, body: UpdateGymLocationDto): Promise<import("../domain/gym-location.entity").GymLocation | import("../domain/gym-location.entity").GymLocation[]>;
}
