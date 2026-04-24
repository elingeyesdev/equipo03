import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymActivity } from './domain/gym-activity.entity';
import { GymActivitySchedule } from './domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from './domain/gym-activity-attendance.entity';
import { ActivitiesService } from './application/activities.service';
import { ActivitiesController } from './infrastructure/activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GymActivity, GymActivitySchedule, GymActivityAttendance])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
