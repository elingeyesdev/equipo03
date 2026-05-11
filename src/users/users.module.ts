import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { UserProfile } from './domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserRole])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
