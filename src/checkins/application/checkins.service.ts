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
import { Gym } from '../../gyms/domain/gym.entity';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';
import {
  type RequestWithUser,
} from '../../common/security/gym-scope';


@Injectable({ scope: Scope.REQUEST })
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Gym) private gymRepo: Repository<Gym>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
    @Optional() private readonly gymGateway?: GymGateway,
  ) {}

  private applyStaffOnlyFilter(qb: SelectQueryBuilder<CheckIn>): void {
    qb.andWhere("checkIn.status != 'COMPLETED'");
  }

  private async applyScopeFilter(qb: SelectQueryBuilder<CheckIn>): Promise<void> {
    const user = this.request.user;
    const level = user?.level ?? 0;

    if (level >= 10) return;

    if (level < 4) {
      if (user?.userId) {
        qb.andWhere('checkIn.user_id = :userId', { userId: user.userId });
      }
      return;
    }

    // level 4 or 5 — resolve gymId from DB (JWT may be stale)
    const callerRoles = await this.userRoleRepo.find({
      where: { userId: Number(user!.userId) },
      relations: ['role', 'gym'],
    });
    const topRole = callerRoles.sort(
      (a, b) => (b.role?.hierarchyLevel ?? 0) - (a.role?.hierarchyLevel ?? 0),
    )[0];
    const callerLevel = Number(topRole?.role?.hierarchyLevel ?? level);
    const callerGymId = Number(topRole?.gym?.id ?? topRole?.gymId ?? 0);

    if (!callerGymId) {
      throw new ForbiddenException('No tienes una sucursal o marca asignada.');
    }

    if (callerLevel === 5) {
      qb.andWhere(
        '(checkIn.gym_id = :callerGymId OR gym.parent_id = :callerGymId)',
        { callerGymId },
      );
    } else {
      qb.andWhere('checkIn.gym_id = :callerGymId', { callerGymId });
    }
  }

  async createCheckIn(userId: number, gymId: number, method = 'MANUAL') {
    const assignments = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });

    const isEligibleStaff = assignments.some((a) => {
      const lvl = a.role?.hierarchyLevel ?? 0;
      return lvl >= 2 && lvl <= 4;
    });

    if (!isEligibleStaff) {
      throw new ForbiddenException(
        'Solo personal autorizado puede registrar ingreso.',
      );
    }

    const exactMatch = assignments.some(a => Number(a.gymId) === Number(gymId));
    if (!exactMatch) {
      const scanningGym = await this.gymRepo.findOne({
        where: { id: Number(gymId) },
        select: { id: true, name: true, parentId: true },
      });
      const parentMatch = scanningGym?.parentId != null
        ? assignments.some(a => Number(a.gymId) === scanningGym.parentId)
        : false;
      if (!parentMatch) {
        throw new ForbiddenException(
          `El personal no pertenece a la sucursal "${scanningGym?.name ?? `#${gymId}`}". No se puede registrar su ingreso aquí.`,
        );
      }
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

    this.applyStaffOnlyFilter(qb);
    await this.applyScopeFilter(qb);

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
    this.applyStaffOnlyFilter(qb);
    await this.applyScopeFilter(qb);
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
    await this.applyScopeFilter(qb);
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
    this.applyStaffOnlyFilter(qb);
    await this.applyScopeFilter(qb);
    const records = await qb.getMany();
    return records.map((c) => this.mapCheckIn(c));
  }

  async findOne(id: number) {
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.id = :id', { id });
    await this.applyScopeFilter(qb);
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
