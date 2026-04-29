import { Repository } from 'typeorm';
import { Routine } from '../domain/routine.entity';
import { RoutineExercise } from '../domain/routine-exercise.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class RoutinesService {
    private routinesRepo;
    private reRepo;
    private readonly request;
    constructor(routinesRepo: Repository<Routine>, reRepo: Repository<RoutineExercise>, request: RequestWithUser);
    private managerGymId;
    create(data: any): Promise<Routine>;
    findAll(): Promise<Routine[]>;
    findByUser(userId: number): Promise<Routine[]>;
    findByTrainer(trainerId: number): Promise<Routine[]>;
    findOne(id: number): Promise<Routine>;
    update(id: number, data: any): Promise<Routine>;
    remove(id: number): Promise<void>;
}
