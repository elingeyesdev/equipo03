import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { NutritionalAppointment } from './domain/nutritional-appointment.entity';
import { Reservation } from '../reservations/domain/reservation.entity';
import { StaffSchedule } from './domain/staff-schedule.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
import { User } from '../users/domain/user.entity';
import { UserProfile } from '../users/domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { ClientAdvisor } from './domain/client-advisor.entity';
import { PhysicalMetricsHistory } from '../metrics/domain/physical-metrics-history.entity';
import { TrainerPlan } from './domain/trainer-plan.entity';
import { StaffService } from './application/staff.service';
import { StaffController } from './infrastructure/staff.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymActivitySchedule,
      NutritionalAppointment,
      Reservation,
      StaffSchedule,
      Gym,
      GymSchedule,
      User,
      UserProfile,
      UserRole,
      ClientAdvisor,
      PhysicalMetricsHistory,
      TrainerPlan,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
