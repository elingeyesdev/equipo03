import { Repository } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class ReservationsService {
    private repo;
    private scheduleRepo;
    private readonly request;
    constructor(repo: Repository<Reservation>, scheduleRepo: Repository<GymActivitySchedule>, request: RequestWithUser);
    private managerGymId;
    private resolveScheduleGymId;
    create(data: any): Promise<Reservation[]>;
    findAll(): Promise<Reservation[]>;
    findByUser(userId: number): Promise<Reservation[]>;
    findOne(id: number): Promise<Reservation>;
    cancel(id: number): Promise<Reservation>;
}
