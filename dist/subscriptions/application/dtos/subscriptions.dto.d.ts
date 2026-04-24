export declare class CreatePlanDto {
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    features?: any;
}
export declare class CreateSubscriptionDto {
    userId: number;
    planId: number;
    homeGymId?: number;
    startDate: string;
    endDate: string;
    status?: string;
}
export declare class UpdateSubscriptionDto {
    status?: string;
    endDate?: string;
    autoRenew?: boolean;
}
export declare class CreatePaymentDto {
    amount: number;
    currency?: string;
    paymentMethod: string;
    transactionReference?: string;
}
