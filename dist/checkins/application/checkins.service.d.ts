import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class CheckinsService {
    private repo;
    private readonly request;
    constructor(repo: Repository<CheckIn>, request: RequestWithUser);
    private getManagerGymId;
    private ensureManagerCanAccessGym;
    create(data: Partial<CheckIn>): Promise<CheckIn>;
    findAll(): Promise<CheckIn[]>;
    findByUser(userId: number): Promise<CheckIn[]>;
    findByGym(gymId: number): Promise<CheckIn[]>;
    findOne(id: number): Promise<CheckIn>;
    checkOut(id: number): Promise<CheckIn>;
}
