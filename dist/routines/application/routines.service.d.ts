import { Repository } from 'typeorm';
import { Routine } from '../domain/routine.entity';
import { RoutineExercise } from '../domain/routine-exercise.entity';
export declare class RoutinesService {
    private routinesRepo;
    private reRepo;
    constructor(routinesRepo: Repository<Routine>, reRepo: Repository<RoutineExercise>);
    create(data: any): Promise<Routine>;
    findAll(): Promise<Routine[]>;
    findByUser(userId: number): Promise<Routine[]>;
    findByTrainer(trainerId: number): Promise<Routine[]>;
    findOne(id: number): Promise<Routine>;
    update(id: number, data: any): Promise<Routine>;
    remove(id: number): Promise<void>;
}
