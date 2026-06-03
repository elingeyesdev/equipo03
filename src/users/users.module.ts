import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { UserProfile } from './domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { PhysicalMetricsHistory } from '../metrics/domain/physical-metrics-history.entity';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/users.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserRole, PhysicalMetricsHistory])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
