import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate } from './domain/notification-template.entity';
import { Notification } from './domain/notification.entity';
import { UserNotificationPreference } from './domain/user-notification-preference.entity';
import { NotificationsService } from './application/notifications.service';
import { NotificationsController } from './infrastructure/notifications.controller';
@Module({
  imports: [TypeOrmModule.forFeature([NotificationTemplate, Notification, UserNotificationPreference])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
