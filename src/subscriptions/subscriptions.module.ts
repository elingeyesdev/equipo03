import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './domain/subscription-plan.entity';
import { UserSubscription } from './domain/user-subscription.entity';
import { SubscriptionPayment } from './domain/subscription-payment.entity';
import { SubscriptionsService } from './application/subscriptions.service';
import { SubscriptionsController } from './infrastructure/subscriptions.controller';
@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, SubscriptionPayment])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
