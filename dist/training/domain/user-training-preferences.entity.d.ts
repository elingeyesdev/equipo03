import { UserTraining } from './user-training.entity';
export declare class UserTrainingPreferences {
    id: number;
    userTrainingId: number;
    preferredTrainingTypes: string[];
    priorityBodyAreas: string[];
    availableDaysPerWeek: number;
    userTraining: UserTraining;
}
