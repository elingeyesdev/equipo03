import { Repository } from 'typeorm';
import { Gym } from '../domain/gym.entity';
import { GymLocation } from '../domain/gym-location.entity';
import { GymSchedule } from '../domain/gym-schedule.entity';
export declare class GymsService {
    private gymsRepo;
    private locRepo;
    private schedRepo;
    constructor(gymsRepo: Repository<Gym>, locRepo: Repository<GymLocation>, schedRepo: Repository<GymSchedule>);
    create(data: any): Promise<Gym>;
    findAll(): Promise<Gym[]>;
    findOne(id: number): Promise<Gym>;
    update(id: number, data: any): Promise<Gym>;
    remove(id: number): Promise<void>;
    addSchedule(gymId: number, data: any): Promise<GymSchedule[]>;
    findSchedules(gymId: number): Promise<GymSchedule[]>;
    removeSchedule(id: number): Promise<import("typeorm").DeleteResult>;
    updateLocation(gymId: number, data: any): Promise<GymLocation | GymLocation[]>;
}
