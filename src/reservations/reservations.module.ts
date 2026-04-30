import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './domain/reservation.entity';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { ReservationsService } from './application/reservations.service';
import { ReservationsController } from './infrastructure/reservations.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Reservation, GymActivitySchedule])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
