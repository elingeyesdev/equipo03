import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
export declare class CheckinsService {
    private repo;
    constructor(repo: Repository<CheckIn>);
    create(data: Partial<CheckIn>): Promise<CheckIn>;
    findAll(): Promise<CheckIn[]>;
    findByUser(userId: number): Promise<CheckIn[]>;
    findByGym(gymId: number): Promise<CheckIn[]>;
    findOne(id: number): Promise<CheckIn>;
    checkOut(id: number): Promise<CheckIn>;
}
