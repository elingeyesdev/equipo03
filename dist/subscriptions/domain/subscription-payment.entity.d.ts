import { UserSubscription } from './user-subscription.entity';
export declare class SubscriptionPayment {
    id: number;
    subscriptionId: number;
    amount: number;
    paymentDate: Date;
    method: string;
    status: string;
    subscription: UserSubscription;
}
