import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reservation } from './domain/reservation.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymActivity } from '../activities/domain/gym-activity.entity';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
import { User } from '../users/domain/user.entity';
import { CheckIn } from '../checkins/domain/check-in.entity';
import { ReservationsService } from './application/reservations.service';
import { ReservationsController } from './infrastructure/reservations.controller';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Gym,
      GymActivity,
      GymActivitySchedule,
      GymSchedule,
      User,
      CheckIn,
    ]),
    PushNotificationsModule,
    UsersModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET')!,
        // expiresIn NO se fija aquí; cada sign() pasa el suyo explícitamente
      }),
    }),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
