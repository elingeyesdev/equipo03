import { User } from '../../users/domain/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Gym } from '../../gyms/domain/gym.entity';
export declare class UserSubscription {
    id: number;
    userId: number;
    planId: number;
    homeGymId: number;
    status: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    plan: SubscriptionPlan;
    homeGym: Gym;
}
