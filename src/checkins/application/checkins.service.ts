import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';

const STAFF_ROLES = ['ENTRENADOR', 'INSTRUCTOR', 'NUTRICIONISTA', 'LIMPIEZA'];
const FORBIDDEN_ROLES = ['CLIENTE', 'USER', 'GERENTE', 'SUPER_ADMIN'];

@Injectable({ scope: Scope.REQUEST })
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private getManagerGymId(): number | null {
    const user = this.request.user;
    return user?.role?.toUpperCase() === 'GERENTE'
      ? (user.gymId ?? null)
      : null;
  }

  private ensureManagerCanAccessGym(gymId: number): void {
    const managerGymId = this.getManagerGymId();
    if (managerGymId !== null && managerGymId !== gymId) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a otra sucursal',
      );
    }
  }

  async createCheckIn(userId: number, gymId: number, method = 'MANUAL') {
    const assignments = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });

    const hasStaffRole = assignments.some((a) =>
      STAFF_ROLES.includes(a.role?.name?.toUpperCase() ?? ''),
    );
    const hasForbiddenRole = assignments.some((a) =>
      FORBIDDEN_ROLES.includes(a.role?.name?.toUpperCase() ?? ''),
    );

    if (!hasStaffRole || hasForbiddenRole) {
      throw new ForbiddenException(
        'Solo personal autorizado (ENTRENADOR, INSTRUCTOR, NUTRICIONISTA, LIMPIEZA) puede registrar ingreso.',
      );
    }

    return this.repo.save(
      this.repo.create({ userId, gymId, method, status: 'ACTIVO' }),
    );
  }

  private mapCheckIn(c: CheckIn) {
    const firstName = c.user?.profile?.firstName ?? '';
    const lastName = c.user?.profile?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Usuario Desconocido';
    const email = c.user?.email ?? '';

    let role = 'CLIENTE';
    if (c.user?.userRoles && c.user.userRoles.length > 0) {
      const primaryRole = c.user.userRoles.find((ur) => ur.role?.name)?.role
        ?.name;
      if (primaryRole) {
        role = primaryRole.toUpperCase();
      }
    }

    return {
      id: c.id,
      userId: c.userId ?? c.user?.id,
      gymId: c.gymId ?? c.gym?.id,
      checkInTime: c.checkInTime,
      checkOutTime: c.checkOutTime,
      status: c.status,
      rejectionReason: null,
      method: c.method ?? 'MANUAL',
      userProfile: {
        fullName,
        email,
        role,
      },
      gym: c.gym ?? null,
    };
  }

  async findAllHistory() {
    const user = this.request.user;
    const managerGymId = this.getManagerGymId();

    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .orderBy('checkIn.checkInTime', 'DESC');

    if (managerGymId !== null) {
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    } else if (
      user?.role?.toUpperCase() === 'USER' ||
      user?.role?.toUpperCase() === 'CLIENTE'
    ) {
      qb.andWhere('checkIn.user_id = :userId', { userId: user.userId });
    }

    const records = await qb.getMany();

    return records.map((c) => {
      const mapped = this.mapCheckIn(c);
      return {
        ...mapped,
        userName: c.user ? c.user.email : 'Usuario Desconocido',
        gymName: c.gym?.name ?? 'Sede no asignada',
      };
    });
  }

  async findAll() {
    const managerGymId = this.getManagerGymId();
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .orderBy('checkIn.checkInTime', 'DESC');
    if (managerGymId !== null)
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findByUser(userId: number) {
    const managerGymId = this.getManagerGymId();
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.user_id = :userId', { userId })
      .orderBy('checkIn.checkInTime', 'DESC');
    if (managerGymId !== null)
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findByGym(gymId: number) {
    this.ensureManagerCanAccessGym(gymId);
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.gym_id = :gymId', { gymId })
      .orderBy('checkIn.checkInTime', 'DESC');
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findOne(id: number) {
    const managerGymId = this.getManagerGymId();
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.id = :id', { id });
    if (managerGymId !== null)
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    const c = await qb.getOne();
    if (!c) throw new NotFoundException(`Check-in ${id} no encontrado`);
    return c;
  }

  async checkOut(id: number) {
    const c = await this.findOne(id);
    c.checkOutTime = new Date();
    c.status = 'COMPLETADO';
    return this.repo.save(c);
  }
}
