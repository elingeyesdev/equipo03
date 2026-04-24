import { Routine } from './routine.entity';
import { ExerciseCatalog } from '../../exercises/domain/exercise-catalog.entity';
export declare class RoutineExercise {
    id: number;
    routineId: number;
    exerciseId: number;
    orderPosition: number;
    setsRecommended: number;
    repsRecommended: string;
    weightRecommendedKg: number;
    restSecondsBetweenSets: number;
    notes: string;
    routine: Routine;
    exercise: ExerciseCatalog;
}
