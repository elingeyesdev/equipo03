import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './domain/gym.entity';
import { GymLocation } from './domain/gym-location.entity';
import { GymSchedule } from './domain/gym-schedule.entity';
import { GymsService } from './application/gyms.service';
import { GymsController } from './infrastructure/gyms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Gym, GymLocation, GymSchedule])],
  controllers: [GymsController],
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}
