import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { UserProfile } from './domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { Role } from '../roles/domain/role.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { PhysicalMetricsHistory } from '../metrics/domain/physical-metrics-history.entity';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserRole,
      Role,
      Gym,
      PhysicalMetricsHistory,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
