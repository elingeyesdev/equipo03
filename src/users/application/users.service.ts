import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../domain/user.entity';
import { UserProfile } from '../domain/user-profile.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { PhysicalMetricsHistory } from '../../metrics/domain/physical-metrics-history.entity';
import type { UpdateProfileDto } from './dtos/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profilesRepo: Repository<UserProfile>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(PhysicalMetricsHistory)
    private readonly metricsRepo: Repository<PhysicalMetricsHistory>,
  ) {}

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    ci?: string;
    roleId?: number;
    gymIds?: number[];
    isActive?: boolean;
  }) {
    const existing = await this.usersRepo.findOne({
      where: { email: data.email },
    });
    if (existing)
      throw new ConflictException('Ya existe un usuario con este email');

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
      ci: data.ci,
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

    // Corregido: cambiamos 'newUserId' por 'saved.id'
    return this.findOne(saved.id);
  }

  async findAll(filters?: { role?: string; gymId?: number }): Promise<User[]> {
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('userRole.gym', 'gym')
      .orderBy('user.id', 'ASC');

    const hasFilter = filters?.role != null || filters?.gymId != null;

    if (hasFilter) {
      // Con filtro: solo usuarios activos que tengan la asignación pedida
      qb.where('user.isActive = :active', { active: true });

      if (filters?.role) {
        qb.andWhere('UPPER(role.name) = :roleName', {
          roleName: filters.role.toUpperCase(),
        });
      }

      if (filters?.gymId != null) {
        qb.andWhere('userRole.gymId = :gymId', { gymId: filters.gymId });
      }
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['profile', 'userRoles', 'userRoles.role', 'userRoles.gym', 'userRoles.gym.parent'],
    });
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    if (user.profile) {
      user.profile.physicalMetrics = await this.metricsRepo.findOne({
        where: { userId: id },
        order: { recordedAt: 'DESC' },
      });
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['profile', 'userRoles', 'userRoles.role', 'userRoles.gym', 'userRoles.gym.parent'],
    });
  }

  async update(
    id: number,
    data: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      ci: string;
      gender: string;
      isActive: boolean;
      roleId?: number;
      gymIds?: number[];
    }>,
  ) {
    const user = await this.findOne(id);
    if (data.password) user.passwordHash = await bcrypt.hash(data.password, 10);
    if (data.email) user.email = data.email;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await this.usersRepo.save(user);

    if (
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.phone !== undefined ||
      data.ci !== undefined ||
      data.gender !== undefined
    ) {
      if (user.profile) {
        if (data.firstName !== undefined)
          user.profile.firstName = data.firstName;
        if (data.lastName !== undefined) user.profile.lastName = data.lastName;
        if (data.phone !== undefined) user.profile.phone = data.phone;
        if (data.ci !== undefined) user.profile.ci = data.ci;
        if (data.gender !== undefined) user.profile.gender = data.gender;
        await this.profilesRepo.save(user.profile);
      } else {
        const newProfile = this.profilesRepo.create({
          userId: id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone,
          ci: data.ci,
          gender: data.gender,
        });
        await this.profilesRepo.save(newProfile);
      }
    }

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

  async getManagerPushTokens(gymId: number): Promise<string[]> {
    const managers = await this.usersRepo
      .createQueryBuilder('u')
      .innerJoin('u.userRoles', 'ur', 'ur.gym_id = :gymId', { gymId })
      .innerJoin('ur.role', 'r', "UPPER(r.name) = 'GERENTE'")
      .where('u.is_active = true')
      .andWhere('u.push_token IS NOT NULL')
      .select(['u.id', 'u.pushToken'])
      .getMany();
    return managers.map((m) => m.pushToken as string);
  }

  async savePushToken(userId: number, token: string): Promise<void> {
    await this.usersRepo.update(userId, { pushToken: token });
  }

  async clearPushToken(userId: number): Promise<void> {
    await this.usersRepo.update(userId, { pushToken: null });
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }

  async updateMyProfile(
    userId: number,
    role: string,
    gymId: number | null | undefined,
    data: UpdateProfileDto,
  ): Promise<{ profile: UserProfile; metrics?: PhysicalMetricsHistory }> {
    const roleUp = role?.toUpperCase();

    const {
      weightKg,
      muscleMassKg,
      chestCm,
      notes,
      birthDate,
      ...profileData
    } = data;

    const hasMetrics =
      weightKg != null ||
      muscleMassKg != null ||
      chestCm != null ||
      notes != null;

    if (roleUp === 'GERENTE' && hasMetrics) {
      throw new BadRequestException(
        'Los gerentes no pueden registrar métricas físicas.',
      );
    }

    let profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      const owner = await this.usersRepo.findOne({
        where: { id: userId },
        select: ['id', 'email'],
      });
      if (!owner)
        throw new NotFoundException(
          `Usuario ${userId} no encontrado. Por favor vuelve a iniciar sesión.`,
        );
      profile = await this.profilesRepo.save(
        this.profilesRepo.create({
          userId: owner.id,
          firstName: owner.email.split('@')[0],
          lastName: '',
        }),
      );
    }

    Object.assign(profile, profileData);
    if (birthDate !== undefined) profile.dateOfBirth = new Date(birthDate);

    let savedProfile: UserProfile;
    try {
      savedProfile = await this.profilesRepo.save(profile);
    } catch (error: any) {
      if (error?.code === '23505') {
        if (error?.detail?.includes('username')) {
          throw new BadRequestException('El nombre de usuario ya está en uso.');
        }
        if (error?.detail?.includes('ci')) {
          throw new BadRequestException(
            'Ese carnet de identidad ya está registrado.',
          );
        }
        throw new BadRequestException('Uno de los campos únicos ya existe.');
      }
      throw new InternalServerErrorException('Error al guardar el perfil.');
    }

    if (hasMetrics) {
      const entry = this.metricsRepo.create({
        userId,
        gymId: gymId ?? undefined,
        weightKg,
        muscleMassKg,
        chestCm,
        notes,
      });
      const savedMetrics = await this.metricsRepo.save(entry);
      return { profile: savedProfile, metrics: savedMetrics };
    }

    return { profile: savedProfile };
  }

  async saveAvatar(
    userId: number,
    filename: string,
    baseUrl: string,
  ): Promise<string> {
    const avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;
    let profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      const owner = await this.usersRepo.findOne({
        where: { id: userId },
        select: ['id', 'email'],
      });
      if (!owner)
        throw new NotFoundException(
          `Usuario ${userId} no encontrado. Por favor vuelve a iniciar sesión.`,
        );
      profile = await this.profilesRepo.save(
        this.profilesRepo.create({
          userId: owner.id,
          firstName: owner.email.split('@')[0],
          lastName: '',
        }),
      );
    }
    profile.avatarUrl = avatarUrl;
    await this.profilesRepo.save(profile);
    return avatarUrl;
  }

  getMetricsHistory(userId: number) {
    return this.metricsRepo.find({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });
  }

  getLatestMetrics(userId: number) {
    return this.metricsRepo.findOne({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });
  }

  async saveMyMetrics(
    userId: number,
    gymId: number | undefined,
    weightKg: number,
    heightCm: number,
    edad?: number,
  ): Promise<{ success: boolean }> {
    // 1. INSERT peso en historial
    await this.metricsRepo.save(
      this.metricsRepo.create({ userId, gymId, weightKg }),
    );

    // 2. UPDATE perfil: altura y, si viene edad, fecha de nacimiento
    let profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      const owner = await this.usersRepo.findOne({
        where: { id: userId },
        select: ['id', 'email'],
      });
      profile = this.profilesRepo.create({
        userId,
        firstName: owner?.email?.split('@')[0] ?? '',
        lastName: '',
      });
    }
    profile.heightCm = heightCm;
    if (edad !== undefined && edad > 0) {
      const birthYear = new Date().getFullYear() - edad;
      profile.dateOfBirth = new Date(`${birthYear}-01-01`);
    }
    await this.profilesRepo.save(profile);

    return { success: true };
  }

  toPublicDto(
    user: User,
    roleOverride?: string | null,
    gymIdOverride?: number | null,
  ) {
    const PRIORITY: Record<string, number> = {
      USER: 10,
      CLIENTE: 10,
      ENTRENADOR: 20,
      INSTRUCTOR: 30,
      GERENTE: 50,
      SUPER_ADMIN: 99,
    };
    const sorted = [...(user.userRoles ?? [])].sort(
      (a, b) =>
        (PRIORITY[b.role?.name?.toUpperCase() ?? ''] ?? 0) -
        (PRIORITY[a.role?.name?.toUpperCase() ?? ''] ?? 0),
    );
    const top = sorted[0];

    const roleName = roleOverride !== undefined
      ? roleOverride
      : (top?.role?.name?.toUpperCase() ?? null);
    const gymId = gymIdOverride !== undefined ? gymIdOverride : (top?.gymId ?? null);
    const hierarchyLevel = top?.role?.hierarchyLevel ?? 0;

    let brandId: number | null = null;
    let brandName: string | null = null;
    let gymName: string | null = null;

    if (gymId) {
      const assignment = (user.userRoles ?? []).find(ur => ur.gymId === gymId);
      const gym = assignment?.gym;
      if (gym) {
        if (gym.parentId === null) {
          brandId = gym.id;
          brandName = gym.name;
        } else {
          gymName = gym.name;
          brandName = gym.parent?.name ?? null;
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: roleName,
      gymId,
      brandId,
      brandName,
      gymName,
      level: hierarchyLevel,
      roles: (user.userRoles ?? []).map((ur) => ({
        id: ur.role?.id ?? null,
        name: ur.role?.name?.toUpperCase() ?? null,
        gymId: ur.gymId ?? null,
      })),
      profile: user.profile ?? null,
    };
  }
}
