import { Routine } from '../../routines/domain/routine.entity';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { WorkoutSet } from './workout-set.entity';
export declare class WorkoutSession {
    id: number;
    routineId: number;
    userId: number;
    gymId: number;
    startedAt: Date;
    finishedAt: Date;
    status: string;
    totalDurationMinutes: number;
    notes: string;
    routine: Routine;
    user: User;
    gym: Gym;
    sets: WorkoutSet[];
}
