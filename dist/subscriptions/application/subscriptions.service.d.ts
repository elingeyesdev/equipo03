import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';
import { UserSubscription } from '../domain/user-subscription.entity';
import { SubscriptionPayment } from '../domain/subscription-payment.entity';
export declare class SubscriptionsService {
    private plansRepo;
    private subsRepo;
    private paymentsRepo;
    constructor(plansRepo: Repository<SubscriptionPlan>, subsRepo: Repository<UserSubscription>, paymentsRepo: Repository<SubscriptionPayment>);
    createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
    findAllPlans(): Promise<SubscriptionPlan[]>;
    findOnePlan(id: number): Promise<SubscriptionPlan>;
    createSubscription(data: any): Promise<UserSubscription[]>;
    findAllSubscriptions(): Promise<UserSubscription[]>;
    findByUser(userId: number): Promise<UserSubscription[]>;
    findOneSubscription(id: number): Promise<UserSubscription>;
    updateSubscription(id: number, data: any): Promise<UserSubscription>;
    createPayment(data: any): Promise<SubscriptionPayment[]>;
    findPaymentsBySubscription(subscriptionId: number): Promise<SubscriptionPayment[]>;
}
