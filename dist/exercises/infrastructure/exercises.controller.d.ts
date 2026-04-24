import { ExercisesService } from '../application/exercises.service';
import { CreateExerciseDto, UpdateExerciseDto } from '../application/dtos/exercises.dto';
export declare class ExercisesController {
    private readonly svc;
    constructor(svc: ExercisesService);
    create(body: CreateExerciseDto): Promise<import("../domain/exercise-catalog.entity").ExerciseCatalog>;
    findAll(mg?: string, dl?: string): Promise<import("../domain/exercise-catalog.entity").ExerciseCatalog[]>;
    findOne(id: number): Promise<import("../domain/exercise-catalog.entity").ExerciseCatalog>;
    update(id: number, body: UpdateExerciseDto): Promise<import("../domain/exercise-catalog.entity").ExerciseCatalog>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
