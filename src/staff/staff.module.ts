import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { NutritionalAppointment } from './domain/nutritional-appointment.entity';
import { Reservation } from '../reservations/domain/reservation.entity';
import { StaffSchedule } from './domain/staff-schedule.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
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
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
