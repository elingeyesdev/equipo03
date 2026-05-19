import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Scope,
  Logger,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { User } from '../../users/domain/user.entity';
import {
  getManagerGymId,
  type RequestUser,
  type RequestWithUser,
} from '../../common/security/gym-scope';
import { ACTIVE_RESERVATION_STATUSES } from '../../common/constants/reservation-status.constants';
import type { CreateReservationDto } from './dtos/reservations.dto';

@Injectable({ scope: Scope.REQUEST })
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation) private repo: Repository<Reservation>,
    @InjectRepository(GymActivitySchedule) private scheduleRepo: Repository<GymActivitySchedule>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private getAuthUser(): RequestUser {
    const user = this.request.user;
    if (!user?.userId) {
      throw new ForbiddenException('Sesión no válida.');
    }
    return user;
  }

  private async assertTargetUserExists(userId: number): Promise<void> {
    const exists = await this.usersRepo.exist({ where: { id: userId, isActive: true } });
    if (!exists) {
      throw new NotFoundException(`Usuario ${userId} no encontrado.`);
    }
  }

  private applyListScope(qb: SelectQueryBuilder<Reservation>): void {
    const { role, userId } = this.getAuthUser();

    if (role === 'ENTRENADOR') {
      throw new ForbiddenException(
        'Los entrenadores deben usar el endpoint de asistencia por clase.',
      );
    }

    if (role === 'CLIENTE') {
      qb.andWhere('reservation.user_id = :uid', { uid: Number(userId) });
    } else if (role === 'GERENTE') {
      const gymId = this.managerGymId();
      qb.andWhere('activity.gym_id = :gymId', { gymId });
    } else if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('No tiene permisos para listar reservas.');
    }
  }

  private async resolveScheduleGymId(gymActivityScheduleId: number): Promise<number> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: gymActivityScheduleId },
      relations: ['gymActivity'],
    });
    if (!schedule?.gymActivity) {
      throw new NotFoundException(`Horario ${gymActivityScheduleId} no encontrado`);
    }
    return schedule.gymActivity.gymId;
  }

  /**
   * Creación HTTP con RBAC: CLIENTE reserva para sí; GERENTE para targetUserId; otros roles prohibidos.
   */
  async createReservation(data: CreateReservationDto): Promise<Reservation> {
    const { role, userId } = this.getAuthUser();
    const actorId = Number(userId);

    if (role === 'SUPER_ADMIN' || role === 'ENTRENADOR') {
      throw new ForbiddenException('Tu rol no permite crear reservas.');
    }

    let reservationUserId: number;

    if (role === 'CLIENTE') {
      reservationUserId = actorId;
    } else if (role === 'GERENTE') {
      if (data.targetUserId == null) {
        throw new BadRequestException(
          'targetUserId es obligatorio para crear reservas como gerente.',
        );
      }
      reservationUserId = Number(data.targetUserId);
      await this.assertTargetUserExists(reservationUserId);

      const mg = this.managerGymId();
      const gid = await this.resolveScheduleGymId(Number(data.gymActivityScheduleId));
      if (gid !== mg) {
        throw new ForbiddenException('No puede crear reservas en otra sucursal');
      }
    } else {
      throw new ForbiddenException('Tu rol no permite crear reservas.');
    }

    const status = data.status ?? 'CONFIRMADA';
    return this.createReservationWithLock(
      Number(data.gymActivityScheduleId),
      reservationUserId,
      data.reservationDate,
      status,
      actorId,
    );
  }

  /**
   * Motor transaccional: bloquea la fila del horario, cuenta cupos activos y persiste la reserva sin race conditions de aforo.
   */
  async createReservationWithLock(
    scheduleId: number,
    userId: number,
    reservationDateRaw: string,
    status = 'CONFIRMADA',
    createdBy?: number,
  ): Promise<Reservation> {
    const reservationDate = this.parseReservationDateOnly(reservationDateRaw);
    const createdById = createdBy ?? userId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const schedule = await queryRunner.manager.findOne(GymActivitySchedule, {
        where: { id: scheduleId },
        relations: ['gymActivity'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!schedule?.gymActivity) {
        throw new NotFoundException(`Horario ${scheduleId} no encontrado`);
      }

      const dup = await queryRunner.manager.exists(Reservation, {
        where: {
          userId,
          gymActivityScheduleId: scheduleId,
          reservationDate,
          status: In([...ACTIVE_RESERVATION_STATUSES]),
        },
      });
      if (dup) {
        throw new ConflictException('Ya tienes una reserva activa para este horario y fecha');
      }

      const activeCount = await queryRunner.manager.count(Reservation, {
        where: {
          gymActivityScheduleId: scheduleId,
          reservationDate,
          status: In([...ACTIVE_RESERVATION_STATUSES]),
        },
      });

      if (activeCount >= schedule.maxAttendees) {
        throw new ConflictException('Cupo agotado. Intenta con otro horario.');
      }

      const entity = queryRunner.manager.create(Reservation, {
        userId,
        gymActivityScheduleId: scheduleId,
        reservationDate,
        status,
        createdBy: createdById,
      });
      const saved = await queryRunner.manager.save(entity);

      await queryRunner.commitTransaction();
      this.logger.debug(`Reserva ${saved.id} creada para schedule=${scheduleId} fecha=${reservationDateRaw}`);
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al procesar la reserva', {
        cause: error instanceof Error ? error : undefined,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /** Fecha calendario UTC medianoche para columnas `date` sin corrimientos por zona. */
  private parseReservationDateOnly(isoDate: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
    if (!m) {
      throw new BadRequestException('reservationDate debe tener formato YYYY-MM-DD');
    }
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo - 1, d));
  }

  findAll() {
    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .orderBy('reservation.created_at', 'DESC');

    this.applyListScope(qb);
    return qb.getMany();
  }

  findByUser(userId: number) {
    const { role, userId: authUserId } = this.getAuthUser();

    if (role === 'ENTRENADOR') {
      throw new ForbiddenException(
        'Los entrenadores deben usar el endpoint de asistencia por clase.',
      );
    }

    if (role === 'CLIENTE' && Number(authUserId) !== userId) {
      throw new ForbiddenException('No tiene permisos para ver reservas de otro usuario.');
    }

    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .where('reservation.user_id = :userId', { userId })
      .orderBy('reservation.reservation_date', 'DESC');

    if (role === 'GERENTE') {
      const gymId = this.managerGymId();
      qb.andWhere('activity.gym_id = :gymId', { gymId });
    } else if (role !== 'SUPER_ADMIN' && role !== 'CLIENTE') {
      throw new ForbiddenException('No tiene permisos para listar reservas.');
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .where('reservation.id = :id', { id });

    this.applyListScope(qb);

    const r = await qb.getOne();
    if (r) return r;

    const { role } = this.getAuthUser();
    const exists = await this.repo.exist({ where: { id } });
    if (exists && (role === 'GERENTE' || role === 'CLIENTE')) {
      throw new ForbiddenException('No tiene permisos para acceder a esta reserva');
    }

    throw new NotFoundException(`Reserva ${id} no encontrada`);
  }

  async cancel(id: number) {
    const r = await this.findOne(id);
    r.status = 'CANCELLED';
    r.cancelledAt = new Date();
    return this.repo.save(r);
  }
}
