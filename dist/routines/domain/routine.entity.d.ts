import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { RoutineExercise } from './routine-exercise.entity';
export declare class Routine {
    id: number;
    name: string;
    description: string;
    trainerId: number;
    assignedUserId: number;
    gymId: number;
    difficultyLevel: string;
    durationWeeks: number;
    isTemplate: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    trainer: User;
    assignedUser: User;
    gym: Gym;
    exercises: RoutineExercise[];
}
