import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Optional,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';
import {
  getManagerGymId,
  type RequestWithUser,
} from '../../common/security/gym-scope';

const STAFF_ROLES = ['ENTRENADOR', 'INSTRUCTOR', 'NUTRICIONISTA', 'LIMPIEZA'];
const FORBIDDEN_ROLES = ['CLIENTE', 'USER', 'GERENTE', 'SUPER_ADMIN'];

@Injectable({ scope: Scope.REQUEST })
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
    @Optional() private readonly gymGateway?: GymGateway,
  ) {}

  private applyScopeFilter(qb: SelectQueryBuilder<CheckIn>): void {
    const user = this.request.user;
    const level = user?.level ?? 0;

    if (level >= 10) return;

    const scopeId = getManagerGymId(this.request);

    if (level >= 4 && scopeId !== null) {
      if (user?.brandId) {
        qb.andWhere(
          '(checkIn.gym_id = :scopeId OR gym.parent_id = :scopeId)',
          { scopeId },
        );
      } else {
        qb.andWhere('checkIn.gym_id = :scopeId', { scopeId });
      }
      return;
    }

    if (level < 4 && user?.userId) {
      qb.andWhere('checkIn.user_id = :userId', { userId: user.userId });
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

    const saved = await this.repo.save(
      this.repo.create({ userId, gymId, method, status: 'ACTIVO' }),
    );

    const current = await this.repo.count({
      where: { gymId, checkOutTime: IsNull(), status: 'ACTIVO' },
    });
    this.gymGateway?.emitToGym(gymId, 'aforo_updated', { gymId, current });

    return saved;
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
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .orderBy('checkIn.checkInTime', 'DESC');

    this.applyScopeFilter(qb);

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
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .orderBy('checkIn.checkInTime', 'DESC');
    this.applyScopeFilter(qb);
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findByUser(userId: number) {
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.user_id = :userId', { userId })
      .orderBy('checkIn.checkInTime', 'DESC');
    this.applyScopeFilter(qb);
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findByGym(gymId: number) {
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.gym_id = :gymId', { gymId })
      .orderBy('checkIn.checkInTime', 'DESC');
    this.applyScopeFilter(qb);
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findOne(id: number) {
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.id = :id', { id });
    this.applyScopeFilter(qb);
    const c = await qb.getOne();
    if (!c) throw new NotFoundException(`Check-in ${id} no encontrado`);
    return c;
  }

  async checkOut(id: number) {
    const c = await this.findOne(id);
    c.checkOutTime = new Date();
    c.status = 'COMPLETADO';
    const saved = await this.repo.save(c);

    const gymId = c.gymId ?? c.gym?.id;
    if (gymId) {
      const current = await this.repo.count({
        where: { gymId, checkOutTime: IsNull(), status: 'ACTIVO' },
      });
      this.gymGateway?.emitToGym(gymId, 'aforo_updated', { gymId, current });
    }

    return saved;
  }
}
