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
import { UserRole } from '../../roles/domain/user-role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profilesRepo: Repository<UserProfile>,
    @InjectRepository(UserRole) private readonly userRolesRepo: Repository<UserRole>,
  ) {}

  async create(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; dateOfBirth?: string; gender?: string; roleId?: number; gymIds?: number[]; isActive?: boolean }) {
    const existing = await this.usersRepo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con este email');

    const user = this.usersRepo.create({
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    const saved = await this.usersRepo.save(user);

    const profile = this.profilesRepo.create({
      userId: saved.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
    });
    await this.profilesRepo.save(profile);

    // Crear roles y asignaciones de gimnasios si se proporcionan
    if (data.roleId || (data.gymIds && data.gymIds.length > 0)) {
      const roleAssignments: UserRole[] = [];

      if (data.roleId && data.gymIds && data.gymIds.length > 0) {
        // Crear una asignación de rol por cada gimnasio
        for (const gymId of data.gymIds) {
          roleAssignments.push(
            this.userRolesRepo.create({
              userId: saved.id,
              roleId: data.roleId,
              gymId: gymId,
            }),
          );
        }
      } else if (data.roleId) {
        // Solo asignar rol sin gimnasio específico
        roleAssignments.push(
          this.userRolesRepo.create({
            userId: saved.id,
            roleId: data.roleId,
          }),
        );
      }

      if (roleAssignments.length > 0) {
        await this.userRolesRepo.save(roleAssignments);
      }
    }

    return this.findOne(newUserId);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      relations: ['profile', 'userRoles', 'userRoles.role', 'userRoles.gym'],
      select: ['id', 'email', 'isActive', 'createdAt'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['profile', 'userRoles', 'userRoles.role', 'userRoles.gym'],
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email }, relations: ['profile'] });
  }

  async update(id: number, data: Partial<{ email: string; password: string; firstName: string; lastName: string; phone: string; isActive: boolean; roleId?: number; gymIds?: number[] }>) {
    const user = await this.findOne(id);
    if (data.password) user.passwordHash = await bcrypt.hash(data.password, 10);
    if (data.email) user.email = data.email;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await this.usersRepo.save(user);

    if (data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined) {
      if (user.profile) {
        if (data.firstName !== undefined) user.profile.firstName = data.firstName;
        if (data.lastName !== undefined) user.profile.lastName = data.lastName;
        if (data.phone !== undefined) user.profile.phone = data.phone;
        await this.profilesRepo.save(user.profile);
      } else {
        const newProfile = this.profilesRepo.create({
          userId: id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone,
        });
        await this.profilesRepo.save(newProfile);
      }
    }

    // Actualizar roles y asignaciones de gimnasios si se proporcionan
    if (data.roleId !== undefined || data.gymIds !== undefined) {
      // Eliminar asignaciones existentes
      await this.userRolesRepo.delete({ userId: id });

      // Crear nuevas asignaciones si se proporcionan roleId y gymIds
      if (data.roleId && data.gymIds && data.gymIds.length > 0) {
        const roleAssignments: UserRole[] = [];
        for (const gymId of data.gymIds) {
          roleAssignments.push(
            this.userRolesRepo.create({
              userId: id,
              roleId: data.roleId,
              gymId: gymId,
            }),
          );
        }
        if (roleAssignments.length > 0) {
          await this.userRolesRepo.save(roleAssignments);
        }
      } else if (data.roleId) {
        // Solo asignar rol sin gimnasio específico
        await this.userRolesRepo.save(
          this.userRolesRepo.create({
            userId: id,
            roleId: data.roleId,
          }),
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }
}
