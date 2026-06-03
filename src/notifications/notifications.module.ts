import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate } from './domain/notification-template.entity';
import { Notification } from './domain/notification.entity';
import { UserNotificationPreference } from './domain/user-notification-preference.entity';
import { NotificationsService } from './application/notifications.service';
import { NotificationsController } from './infrastructure/notifications.controller';
import { GymGateway } from './infrastructure/gym.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, Notification, UserNotificationPreference]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, GymGateway],
  exports: [NotificationsService, GymGateway],
})
export class NotificationsModule {}
