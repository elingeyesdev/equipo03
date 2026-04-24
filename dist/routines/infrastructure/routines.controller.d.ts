import { RoutinesService } from '../application/routines.service';
import { CreateRoutineDto, UpdateRoutineDto } from '../application/dtos/routines.dto';
export declare class RoutinesController {
    private readonly svc;
    constructor(svc: RoutinesService);
    create(body: CreateRoutineDto): Promise<import("../domain/routine.entity").Routine>;
    findAll(): Promise<import("../domain/routine.entity").Routine[]>;
    findByUser(uid: number): Promise<import("../domain/routine.entity").Routine[]>;
    findByTrainer(tid: number): Promise<import("../domain/routine.entity").Routine[]>;
    findOne(id: number): Promise<import("../domain/routine.entity").Routine>;
    update(id: number, body: UpdateRoutineDto): Promise<import("../domain/routine.entity").Routine>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
