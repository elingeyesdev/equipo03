import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Permission } from '../domain/permission.entity';
import { Role } from '../domain/role.entity';
import { RolePermission } from '../domain/role-permission.entity';
import { UserRole } from '../domain/user-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepo: Repository<Permission>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private rpRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private urRepo: Repository<UserRole>,
  ) {}

  // ── Permissions ─────────────────────────────────────
  createPermission(data: Partial<Permission>) {
    return this.permissionsRepo.save(this.permissionsRepo.create(data));
  }
  findAllPermissions() {
    return this.permissionsRepo.find();
  }

  // ── Roles ───────────────────────────────────────────
  async createRole(data: Partial<Role>) {
    if (data.name) {
      const existing = await this.rolesRepo.findOneBy({ name: data.name });
      if (existing) {
        throw new ConflictException('Ya existe un rol con ese nombre.');
      }
    }
    return this.rolesRepo.save(this.rolesRepo.create(data));
  }

  async updateRole(id: number, data: Partial<Role>) {
    const role = await this.findOneRole(id);
    if (data.name && data.name !== role.name) {
      const existing = await this.rolesRepo.findOneBy({ name: data.name });
      if (existing) {
        throw new ConflictException('Ya existe un rol con ese nombre.');
      }
    }
    Object.assign(role, data);
    return this.rolesRepo.save(role);
  }
  findAllRoles() {
    return this.rolesRepo.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }
  async findOneRole(id: number) {
    const role = await this.rolesRepo.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException(`Rol ${id} no encontrado`);
    return role;
  }

  // ── Role-Permission assignment ──────────────────────
  assignPermissionToRole(
    roleId: number,
    permissionId: number,
    grantedBy?: number,
  ) {
    return this.rpRepo.save(
      this.rpRepo.create({ roleId, permissionId, grantedBy }),
    );
  }
  removePermissionFromRole(id: number) {
    return this.rpRepo.delete(id);
  }

  // ── User-Role assignment ────────────────────────────
  assignRoleToUser(
    userId: number,
    roleId: number,
    gymId?: number,
    assignedBy?: number,
    expiresAt?: string,
  ) {
    return this.urRepo.save(
      this.urRepo.create({
        userId,
        roleId,
        gymId,
        assignedBy,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }),
    );
  }

  async replaceUserRoleAssignments(
    userId: number,
    roleId: number,
    gymIds: number[],
    assignedBy?: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(UserRole) : this.urRepo;
    await repo.delete({ userId });

    const unique = [
      ...new Set(gymIds.filter((id) => Number.isFinite(id) && id > 0)),
    ];

    if (unique.length === 0) {
      await repo.save(repo.create({ userId, roleId, assignedBy }));
      return;
    }

    const rows = unique.map((gymId) =>
      repo.create({ userId, roleId, gymId, assignedBy }),
    );
    await repo.save(rows);
  }
  findUserRoles(userId: number) {
    return this.urRepo.find({ where: { userId }, relations: ['role', 'gym'] });
  }
  removeUserRole(id: number) {
    return this.urRepo.delete(id);
  }

  // ── Role deletion ───────────────────────────────────
  async removeRole(id: number) {
    const role = await this.findOneRole(id);
    if (role.isSystemRole) {
      throw new ConflictException('No se pueden eliminar roles de sistema.');
    }
    await this.rolesRepo.delete(id);
    return { deleted: true };
  }
}
