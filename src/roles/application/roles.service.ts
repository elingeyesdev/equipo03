import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../domain/permission.entity';
import { Role } from '../domain/role.entity';
import { RolePermission } from '../domain/role-permission.entity';
import { UserRole } from '../domain/user-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Permission) private permissionsRepo: Repository<Permission>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    @InjectRepository(RolePermission) private rpRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private urRepo: Repository<UserRole>,
  ) {}

  // ── Permissions ─────────────────────────────────────
  createPermission(data: Partial<Permission>) { return this.permissionsRepo.save(this.permissionsRepo.create(data)); }
  findAllPermissions() { return this.permissionsRepo.find(); }

  // ── Roles ───────────────────────────────────────────
  createRole(data: Partial<Role>) { return this.rolesRepo.save(this.rolesRepo.create(data)); }
  findAllRoles() { return this.rolesRepo.find({ relations: ['rolePermissions', 'rolePermissions.permission'] }); }
  async findOneRole(id: number) {
    const role = await this.rolesRepo.findOne({ where: { id }, relations: ['rolePermissions', 'rolePermissions.permission'] });
    if (!role) throw new NotFoundException(`Rol ${id} no encontrado`);
    return role;
  }

  // ── Role-Permission assignment ──────────────────────
  assignPermissionToRole(roleId: number, permissionId: number, grantedBy?: number) {
    return this.rpRepo.save(this.rpRepo.create({ roleId, permissionId, grantedBy }));
  }
  removePermissionFromRole(id: number) { return this.rpRepo.delete(id); }

  // ── User-Role assignment ────────────────────────────
  assignRoleToUser(userId: number, roleId: number, gymId?: number, assignedBy?: number, expiresAt?: string) {
    return this.urRepo.save(this.urRepo.create({ userId, roleId, gymId, assignedBy, expiresAt: expiresAt ? new Date(expiresAt) : undefined }));
  }
  findUserRoles(userId: number) { return this.urRepo.find({ where: { userId }, relations: ['role', 'gym'] }); }
  removeUserRole(id: number) { return this.urRepo.delete(id); }
}
