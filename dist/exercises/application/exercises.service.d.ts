import { Repository } from 'typeorm';
import { ExerciseCatalog } from '../domain/exercise-catalog.entity';
export declare class ExercisesService {
    private repo;
    constructor(repo: Repository<ExerciseCatalog>);
    create(data: Partial<ExerciseCatalog>): Promise<ExerciseCatalog>;
    findAll(filters?: {
        muscleGroup?: string;
        difficultyLevel?: string;
    }): Promise<ExerciseCatalog[]>;
    findOne(id: number): Promise<ExerciseCatalog>;
    update(id: number, data: Partial<ExerciseCatalog>): Promise<ExerciseCatalog>;
    remove(id: number): Promise<void>;
}
