import { WorkoutSession } from './workout-session.entity';
import { RoutineExercise } from '../../routines/domain/routine-exercise.entity';
export declare class WorkoutSet {
    id: number;
    sessionId: number;
    routineExerciseId: number;
    setNumber: number;
    repsCompleted: number;
    weightUsedKg: number;
    restTakenSeconds: number;
    completedAt: Date;
    ratingPerceivedExertion: number;
    session: WorkoutSession;
    routineExercise: RoutineExercise;
}
