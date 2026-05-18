import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../domain/user.entity';
import { UserProfile } from '../domain/user-profile.entity';
import { Role } from '../../roles/domain/role.entity';
import { RolesService } from '../../roles/application/roles.service';

/** Coincide con el rol "Usuario Estándar" en el dashboard (ID 3 en `roles`). */
const DEFAULT_REGISTRATION_ROLE_ID = 3;

const ROLE_GERENTE = 2;
const ROLE_ENTRENADOR = 5;
const ROLE_NUTRICIONISTA = 6;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profilesRepo: Repository<UserProfile>,
    private readonly dataSource: DataSource,
    private readonly rolesService: RolesService,
  ) {}

  private ensureRoleScope(roleId: number, gymIds: number[]): void {
    const uniq = [...new Set(gymIds.filter((id) => Number.isFinite(id) && id > 0))];

    if (roleId === ROLE_GERENTE) {
      if (uniq.length !== 1) {
        throw new BadRequestException('El gerente debe tener exactamente una sede asignada.');
      }
      return;
    }
    if (roleId === ROLE_ENTRENADOR || roleId === ROLE_NUTRICIONISTA) {
      if (uniq.length < 1) {
        throw new BadRequestException('Selecciona al menos una sede para entrenador o nutricionista.');
      }
      return;
    }

    if (uniq.length > 0) {
      throw new BadRequestException('Este rol no admite sedes asignadas; debe ir gymIds vacío.');
    }
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    /** Si se omite (p. ej. registro público), se usa el rol estándar de usuario (ID 3). */
    roleId?: number;
    gymIds?: number[];
    isActive?: boolean;
  }) {
    const resolvedRoleId = data.roleId ?? DEFAULT_REGISTRATION_ROLE_ID;
    const gymIdsResolved = data.gymIds ?? [];
    this.ensureRoleScope(resolvedRoleId, gymIdsResolved);

    const newUserId = await this.dataSource.transaction(async (manager) => {
      const usersRepo = manager.getRepository(User);
      const profilesRepo = manager.getRepository(UserProfile);
      const rolesRepo = manager.getRepository(Role);

      const existing = await usersRepo.findOne({ where: { email: data.email } });
      if (existing) throw new ConflictException('Ya existe un usuario con este email');

      const roleExists = await rolesRepo.exist({ where: { id: resolvedRoleId } });
      if (!roleExists) throw new NotFoundException(`Rol ${resolvedRoleId} no encontrado`);

      const userEntity = usersRepo.create({
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        isActive: data.isActive ?? true,
      });
      const savedUser = await usersRepo.save(userEntity);

      const profileEntity = profilesRepo.create({
        userId: savedUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
      });
      await profilesRepo.save(profileEntity);

      await this.rolesService.replaceUserRoleAssignments(
        savedUser.id,
        resolvedRoleId,
        gymIdsResolved,
        undefined,
        manager,
      );

      return savedUser.id;
    });

    return this.findOne(newUserId);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({ relations: ['profile'], select: ['id', 'email', 'isActive', 'createdAt'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['profile', 'userRoles', 'userRoles.role'],
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email }, relations: ['profile'] });
  }

  async update(
    id: number,
    data: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      isActive: boolean;
      roleId: number;
      gymIds: number[];
    }>,
  ) {
    const shouldSyncRoles =
      data.roleId !== undefined && Array.isArray(data.gymIds);

    if (!shouldSyncRoles) {
      return this.updateUserFieldsOnly(id, data);
    }

    const gymIdsResolved = data.gymIds as number[];
    this.ensureRoleScope(data.roleId as number, gymIdsResolved);

    await this.dataSource.transaction(async (manager) => {
      const usersRepoTx = manager.getRepository(User);
      const profilesRepoTx = manager.getRepository(UserProfile);
      const rolesRepo = manager.getRepository(Role);

      const user = await usersRepoTx.findOne({ where: { id }, relations: ['profile'] });
      if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

      const roleExists = await rolesRepo.exist({ where: { id: data.roleId } });
      if (!roleExists) throw new NotFoundException(`Rol ${data.roleId} no encontrado`);

      if (data.password) user.passwordHash = await bcrypt.hash(data.password, 10);
      if (data.email) user.email = data.email;
      if (data.isActive !== undefined) user.isActive = data.isActive;
      await usersRepoTx.save(user);

      if (
        user.profile &&
        (data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined)
      ) {
        if (data.firstName !== undefined) user.profile.firstName = data.firstName;
        if (data.lastName !== undefined) user.profile.lastName = data.lastName;
        if (data.phone !== undefined) user.profile.phone = data.phone;
        await profilesRepoTx.save(user.profile);
      }

      await this.rolesService.replaceUserRoleAssignments(
        id,
        data.roleId as number,
        gymIdsResolved,
        undefined,
        manager,
      );
    });

    return this.findOne(id);
  }

  private async updateUserFieldsOnly(
    id: number,
    data: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      isActive: boolean;
    }>,
  ) {
    const user = await this.findOne(id);
    if (data.password) user.passwordHash = await bcrypt.hash(data.password, 10);
    if (data.email) user.email = data.email;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await this.usersRepo.save(user);

    if (
      user.profile &&
      (data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined)
    ) {
      if (data.firstName !== undefined) user.profile.firstName = data.firstName;
      if (data.lastName !== undefined) user.profile.lastName = data.lastName;
      if (data.phone !== undefined) user.profile.phone = data.phone;
      await this.profilesRepo.save(user.profile);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }
}
