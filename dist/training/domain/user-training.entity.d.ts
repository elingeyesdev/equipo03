import { User } from '../../users/domain/user.entity';
import { UserTrainingGoals } from './user-training-goals.entity';
import { UserTrainingPreferences } from './user-training-preferences.entity';
export declare class UserTraining {
    id: number;
    userId: number;
    createdAt: Date;
    user: User;
    goals: UserTrainingGoals;
    preferences: UserTrainingPreferences;
}
