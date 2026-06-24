import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './domain/gym.entity';
import { GymLocation } from './domain/gym-location.entity';
import { GymSchedule } from './domain/gym-schedule.entity';
import { MachineInventory } from './domain/machine-inventory.entity';
import { Reservation } from '../reservations/domain/reservation.entity';
import { CheckIn } from '../checkins/domain/check-in.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { StorageModule } from '../shared/infrastructure/storage/storage.module';
import { GymsService } from './application/gyms.service';
import { MachinesService } from './application/machines.service';
import { GymsController } from './infrastructure/gyms.controller';
import { MachinesController } from './infrastructure/machines.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gym,
      GymLocation,
      GymSchedule,
      MachineInventory,
      Reservation,
      CheckIn,
      UserRole,
    ]),
    StorageModule,
  ],
  controllers: [GymsController, MachinesController],
  providers: [GymsService, MachinesService],
  exports: [GymsService, MachinesService],
})
export class GymsModule {}
