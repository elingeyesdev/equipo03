import { SubscriptionsService } from '../application/subscriptions.service';
import { CreatePlanDto, CreateSubscriptionDto, UpdateSubscriptionDto, CreatePaymentDto } from '../application/dtos/subscriptions.dto';
export declare class SubscriptionsController {
    private readonly svc;
    constructor(svc: SubscriptionsService);
    createPlan(body: CreatePlanDto): Promise<import("../domain/subscription-plan.entity").SubscriptionPlan>;
    findPlans(): Promise<import("../domain/subscription-plan.entity").SubscriptionPlan[]>;
    create(body: CreateSubscriptionDto): Promise<import("../domain/user-subscription.entity").UserSubscription[]>;
    findAll(): Promise<import("../domain/user-subscription.entity").UserSubscription[]>;
    findByUser(uid: number): Promise<import("../domain/user-subscription.entity").UserSubscription[]>;
    findOne(id: number): Promise<import("../domain/user-subscription.entity").UserSubscription>;
    update(id: number, body: UpdateSubscriptionDto): Promise<import("../domain/user-subscription.entity").UserSubscription>;
    createPayment(id: number, body: CreatePaymentDto): Promise<import("../domain/subscription-payment.entity").SubscriptionPayment[]>;
    findPayments(id: number): Promise<import("../domain/subscription-payment.entity").SubscriptionPayment[]>;
}
