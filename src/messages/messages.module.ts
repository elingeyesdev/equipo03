import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './domain/direct-message.entity';
import { Conversation } from './domain/conversation.entity';
import { User } from '../users/domain/user.entity';
import { MessagesService } from './application/messages.service';
import { MessagesController } from './infrastructure/messages.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessage, Conversation, User]),
    NotificationsModule,
    PushNotificationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
