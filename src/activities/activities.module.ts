import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymActivity } from './domain/gym-activity.entity';
import { GymActivitySchedule } from './domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from './domain/gym-activity-attendance.entity';
import { User } from '../users/domain/user.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { ActivitiesService } from './application/activities.service';
import { ActivitiesController } from './infrastructure/activities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymActivity,
      GymActivitySchedule,
      GymActivityAttendance,
      User,
      Gym,
      GymSchedule,
      UserRole,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
