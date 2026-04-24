import { User } from '../../users/domain/user.entity';
export declare class UserTrainingRestriction {
    id: number;
    userId: number;
    restrictionType: string;
    description: string;
    affectedBodyAreas: string[];
    movementsToAvoid: string[];
    requiresTrainerApproval: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
