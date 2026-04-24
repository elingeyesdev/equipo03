import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './domain/permission.entity';
import { Role } from './domain/role.entity';
import { RolePermission } from './domain/role-permission.entity';
import { UserRole } from './domain/user-role.entity';
import { RolesService } from './application/roles.service';
import { RolesController } from './infrastructure/roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, RolePermission, UserRole])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
