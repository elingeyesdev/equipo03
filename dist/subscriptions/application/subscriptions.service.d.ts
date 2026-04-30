import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';
import { UserSubscription } from '../domain/user-subscription.entity';
import { SubscriptionPayment } from '../domain/subscription-payment.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class SubscriptionsService {
    private plansRepo;
    private subsRepo;
    private paymentsRepo;
    private readonly request;
    constructor(plansRepo: Repository<SubscriptionPlan>, subsRepo: Repository<UserSubscription>, paymentsRepo: Repository<SubscriptionPayment>, request: RequestWithUser);
    private managerGymId;
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
