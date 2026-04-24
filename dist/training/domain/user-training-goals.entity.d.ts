import { UserTraining } from './user-training.entity';
export declare class UserTrainingGoals {
    id: number;
    userTrainingId: number;
    primaryGoal: string;
    experienceLevel: string;
    userTraining: UserTraining;
}
