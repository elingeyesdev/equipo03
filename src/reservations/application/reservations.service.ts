import { randomUUID } from 'crypto';
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
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
import { GymActivity } from '../../activities/domain/gym-activity.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { User } from '../../users/domain/user.entity';
import { CheckIn } from '../../checkins/domain/check-in.entity';
import {
  getManagerGymId,
  type RequestUser,
  type RequestWithUser,
} from '../../common/security/gym-scope';
import { ACTIVE_RESERVATION_STATUSES } from '../../common/constants/reservation-status.constants';
import {
  DayOfWeek,
  aliasesForCanonicalDay,
} from '../../activities/application/dtos/create-activity-schedule.dto';
import type { CreateReservationDto } from './dtos/reservations.dto';
import { PushNotificationsService } from '../../push-notifications/application/push-notifications.service';
import { UsersService } from '../../users/application/users.service';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';

const DAY_UTC_INDEX: DayOfWeek[] = [
  DayOfWeek.DOMINGO,
  DayOfWeek.LUNES,
  DayOfWeek.MARTES,
  DayOfWeek.MIERCOLES,
  DayOfWeek.JUEVES,
  DayOfWeek.VIERNES,
  DayOfWeek.SABADO,
];

@Injectable({ scope: Scope.REQUEST })
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation) private repo: Repository<Reservation>,
    @InjectRepository(GymActivity) private activityRepo: Repository<GymActivity>,
    @InjectRepository(GymActivitySchedule) private scheduleRepo: Repository<GymActivitySchedule>,
    @InjectRepository(GymSchedule) private gymScheduleRepo: Repository<GymSchedule>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(CheckIn) private checkInRepo: Repository<CheckIn>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly jwtService: JwtService,
    private readonly pushService: PushNotificationsService,
    private readonly usersService: UsersService,
    private readonly gymGateway: GymGateway,
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

    const roleUp = role?.toUpperCase();

    if (roleUp === 'CLIENTE' || roleUp === 'USER') {
      qb.andWhere('reservation.user_id = :uid', { uid: Number(userId) });
    } else if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      const gymId = this.managerGymId();
      this.logger.debug(`[applyListScope] ${roleUp} gymId=${gymId} userId=${userId}`);
      const auditStatuses = ['CONFIRMADA', 'COMPLETADA'];
      qb.andWhere(
        '(activity.gym_id = :gymId OR reservation.gym_id = :gymId)',
        { gymId },
      );
      qb.andWhere('reservation.status IN (:...auditStatuses)', { auditStatuses });
    } else if (roleUp !== 'SUPER_ADMIN') {
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

  private toHHmm(t: string): string {
    return String(t).trim().slice(0, 5);
  }

  private deriveDayOfWeek(isoDate: string): DayOfWeek {
    const [y, m, d] = isoDate.split('-').map(Number);
    return DAY_UTC_INDEX[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }

  private async assertTimeWithinGymHours(
    gymId: number,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const dayVariants = aliasesForCanonicalDay(day);
    const slots = await this.gymScheduleRepo.find({ where: { gymId, isHoliday: false } });
    const sameDay = slots.filter((s) => dayVariants.includes(String(s.dayOfWeek).toUpperCase()));
    if (sameDay.length === 0) return;

    const start = this.toHHmm(startTime);
    const end = this.toHHmm(endTime);
    const ok = sameDay.some((row) => {
      const open = this.toHHmm(row.opensAt as unknown as string);
      const close = this.toHHmm(row.closesAt as unknown as string);
      return open <= start && close >= end;
    });

    if (!ok) {
      throw new BadRequestException(
        `El bloque ${startTime}–${endTime} está fuera del horario de apertura de la sede`,
      );
    }
  }

  /**
   * Resuelve el ID del horario de actividad a usar.
   * Flujo estándar: gymActivityScheduleId presente → úsalo directamente.
   * Flujo abierto: gymId + startTime + endTime → valida contra gym_schedules y busca
   * la primera GymActivitySchedule que cubra ese bloque ese día de la semana.
   */
  private async resolveScheduleId(dto: CreateReservationDto): Promise<number> {
    if (dto.gymActivityScheduleId != null) {
      return Number(dto.gymActivityScheduleId);
    }

    if (!dto.gymId || !dto.startTime || !dto.endTime) {
      throw new BadRequestException(
        'Proporciona gymActivityScheduleId, o los tres campos gymId + startTime + endTime para flujo abierto.',
      );
    }

    const gymIdNum = Number(dto.gymId);
    const day = this.deriveDayOfWeek(dto.reservationDate);
    await this.assertTimeWithinGymHours(
      gymIdNum,
      day,
      dto.startTime,
      dto.endTime,
    );

    const dayVariants = aliasesForCanonicalDay(day);
    const sched = await this.scheduleRepo.findOne({
      where: {
        dayOfWeek: In(dayVariants),
        startTime: LessThanOrEqual(dto.startTime),
        endTime: MoreThanOrEqual(dto.endTime),
        gymActivity: {
          gymId: gymIdNum,
          isActive: true,
        },
      },
      relations: ['gymActivity'],
    });

    if (!sched) {
      throw new NotFoundException(
        `Sin actividad programada para el bloque ${dto.startTime}–${dto.endTime} el ${day} en la sede ${dto.gymId}. ` +
          `Consulta GET /api/activities?gymId=${dto.gymId} para ver horarios disponibles.`,
      );
    }

    return sched.id;
  }

  /**
   * Flujo libre: activityId presente, sin scheduleId.
   * Salta cálculo de aforo por bloques.
   * Estado inicial: PENDIENTE.
   */
  private async createFreeAccessReservation(
    data: CreateReservationDto,
    reservationUserId: number,
    actorId: number,
  ): Promise<Reservation> {
    const activity = await this.activityRepo.findOne({
      where: { id: data.activityId, isActive: true },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad ${data.activityId} no encontrada.`);
    }

    if (!activity.isFreeAccess) {
      throw new BadRequestException(
        'Esta clase requiere un horario específico. Usa gymActivityScheduleId.',
      );
    }

    // Validación multitenant para GERENTE
    const roleUp = this.getAuthUser().role?.toUpperCase();
    if (roleUp === 'GERENTE') {
      const managerGymId = this.managerGymId();
      if (Number(activity.gymId) !== Number(managerGymId)) {
        throw new ForbiddenException('La actividad pertenece a otra sucursal.');
      }
    }

    // ── Flujo libre exige tiempos explícitos del cliente ────────────────────
    if (!data.startTime || !data.endTime) {
      throw new BadRequestException(
        'Las actividades de acceso libre requieren startTime y endTime (HH:mm).',
      );
    }

    const reservationDate = this.parseReservationDateOnly(data.reservationDate);

    // ── Dup-check: misma actividad, mismo usuario, misma fecha, estado activo ─
    const dup = await this.repo.exist({
      where: {
        userId: reservationUserId,
        activityId: activity.id,
        reservationDate,
        status: In([...ACTIVE_RESERVATION_STATUSES]),
      },
    });
    if (dup) {
      throw new ConflictException(
        'Ya tienes una reserva activa para esta actividad en esta fecha.',
      );
    }

    const entity = this.repo.create({
      userId: reservationUserId,
      gymActivityScheduleId: null,
      gymId: activity.gymId,
      activityId: activity.id,
      reservationDate,
      startTime: data.startTime,   // tiempo elegido por el cliente
      endTime: data.endTime,
      status: 'PENDIENTE',
      createdBy: actorId,
    });

    const saved = await this.repo.save(entity);
    this.logger.log(
      `Reserva libre ${saved.id}: activity=${activity.id} gym=${activity.gymId} user=${reservationUserId}`,
    );
    return saved;
  }

  /**
   * Punto de entrada único para crear reservas.
   * LÍNEA 1: si llega activityId → flujo libre, return inmediato.
   * Solo baja al flujo de horarios si activityId es nulo.
   */
  async createReservation(data: CreateReservationDto): Promise<Reservation> {
    const { role, userId } = this.getAuthUser();
    const actorId     = Number(userId);
    const roleUp      = (role ?? '').toUpperCase();

    // ── RBAC ────────────────────────────────────────────────────────────────
    if (roleUp === 'SUPER_ADMIN' || roleUp === 'ENTRENADOR') {
      throw new ForbiddenException('Tu rol no permite crear reservas.');
    }

    // ── Resolver usuario objetivo ───────────────────────────────────────────
    let reservationUserId: number;
    if (roleUp === 'CLIENTE' || roleUp === 'USER') {
      reservationUserId = actorId;
    } else if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      if (data.targetUserId == null) {
        throw new BadRequestException('targetUserId es obligatorio para crear reservas como staff.');
      }
      reservationUserId = Number(data.targetUserId);
      await this.assertTargetUserExists(reservationUserId);
    } else {
      throw new ForbiddenException('Tu rol no permite crear reservas.');
    }

    // ════════════════════════════════════════════════════════════════════════
    // BLOQUE CORTANTE — FLUJO LIBRE
    // Condición: activityId presente. Return absoluto. No cae abajo.
    // ════════════════════════════════════════════════════════════════════════
    const rawActivityId = data.activityId;
    if (rawActivityId !== undefined && rawActivityId !== null) {
      const actId = Number(rawActivityId);

      const activity = await this.activityRepo.findOne({
        where: { id: actId, isActive: true },
      });
      if (!activity) {
        throw new NotFoundException(`Actividad ${actId} no encontrada.`);
      }
      if (!activity.isFreeAccess) {
        throw new BadRequestException(
          'Esta clase requiere gymActivityScheduleId (no es de acceso libre).',
        );
      }

      // Multitenant: GERENTE solo puede reservar en su sede
      if (roleUp === 'GERENTE') {
        const mg = this.managerGymId();
        if (Number(activity.gymId) !== Number(mg)) {
          throw new ForbiddenException('La actividad pertenece a otra sucursal.');
        }
      }

      if (!data.startTime || !data.endTime) {
        throw new BadRequestException(
          'Acceso libre requiere startTime y endTime (HH:mm).',
        );
      }

      const reservationDate = this.parseReservationDateOnly(data.reservationDate);

      const dup = await this.repo.exist({
        where: {
          userId: reservationUserId,
          activityId: activity.id,
          reservationDate,
          status: In([...ACTIVE_RESERVATION_STATUSES]),
        },
      });
      if (dup) {
        throw new ConflictException(
          'Ya tienes una reserva activa para esta actividad en esta fecha.',
        );
      }

      const saved = await this.repo.save(
        this.repo.create({
          userId:                  reservationUserId,
          gymActivityScheduleId:   null,
          gymId:                   activity.gymId,
          activityId:              activity.id,
          reservationDate,
          startTime:               data.startTime,
          endTime:                 data.endTime,
          status:                  'CONFIRMADA',
          createdBy:               actorId,
          qrToken:                 randomUUID(),
        }),
      );

      this.logger.log(
        `[FREE] Reserva ${saved.id} activity=${activity.id} gym=${activity.gymId} user=${reservationUserId}`,
      );
      // Fire-and-forget: no bloquea la respuesta al cliente
      this.notifyGymManagers(activity.gymId, saved.id).catch(() => void 0);
      return saved; // ← RETURN ABSOLUTO — nada más ejecuta
    }
    // ════════════════════════════════════════════════════════════════════════
    // FIN BLOQUE CORTANTE
    // Solo llega aquí si activityId era nulo → flujo estándar con horario
    // ════════════════════════════════════════════════════════════════════════

    const scheduleId = await this.resolveScheduleId(data);

    if (roleUp === 'GERENTE') {
      const mg  = this.managerGymId();
      const gid = await this.resolveScheduleGymId(scheduleId);
      if (gid !== mg) {
        throw new ForbiddenException('No puede crear reservas en otra sucursal');
      }
    }

    const status = data.status ?? 'CONFIRMADA';
    return this.createReservationWithLock(
      scheduleId,
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
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!schedule) {
        throw new NotFoundException(`Horario ${scheduleId} no encontrado`);
      }

      const scheduleWithActivity = await queryRunner.manager.findOne(
        GymActivitySchedule,
        {
          where: { id: scheduleId },
          relations: ['gymActivity'],
        },
      );

      if (!scheduleWithActivity?.gymActivity) {
        throw new NotFoundException(
          `Actividad del horario ${scheduleId} no encontrada`,
        );
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

      // Tiempos de BD — el cliente no los dicta; se copian del Schedule exacto
      const entity = queryRunner.manager.create(Reservation, {
        userId,
        gymActivityScheduleId: scheduleId,
        gymId: scheduleWithActivity.gymActivity.gymId,
        activityId: scheduleWithActivity.gymActivity.id,
        reservationDate,
        startTime: String(schedule.startTime).slice(0, 5),   // HH:mm desde BD
        endTime:   String(schedule.endTime).slice(0, 5),
        status,
        createdBy: createdById,
        qrToken:   randomUUID(),
      });
      const saved = await queryRunner.manager.save(entity);

      await queryRunner.commitTransaction();
      this.logger.debug(
        `Reserva ${saved.id} schedule=${scheduleId} ${schedule.startTime}-${schedule.endTime} fecha=${reservationDateRaw}`,
      );
      // Fire-and-forget: no bloquea la respuesta al cliente
      if (saved.gymId) {
        this.notifyGymManagers(saved.gymId, saved.id).catch(() => void 0);
      }
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

  async findAll(opts: { date?: string; status?: string; page: number; limit: number; gymId?: number }) {
    const { date, status, page, limit } = opts;
    const { role, gymId: tokenGymId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();

    const qb = this.repo
      .createQueryBuilder('reservation')
      // Usuario
      .leftJoinAndSelect('reservation.user',                'user')
      .leftJoinAndSelect('user.profile',                    'userProfile')
      // Sede
      .leftJoinAndSelect('reservation.gym',                 'gym')
      // Flujo libre
      .leftJoinAndSelect('reservation.activity',            'freeActivity')
      .addSelect('freeActivity.name')
      // Flujo programado
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity',            'activity')  // alias requerido por applyListScope
      .addSelect('activity.name')
      .leftJoinAndSelect('schedule.instructor',             'schedInstructor')
      .leftJoinAndSelect('schedInstructor.profile',         'schedInstructorProfile')
      .orderBy('reservation.reservationDate', 'DESC')
      .addOrderBy('reservation.createdAt', 'DESC');

    // ── Filtro de fecha ───────────────────────────────────────────────────────
    if (date) {
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(date.trim());
      if (m) {
        qb.andWhere('reservation.reservationDate = :date', { date: date.trim() });
      }
    }

    // ── Filtro de estado ──────────────────────────────────────────────────────
    if (status) {
      qb.andWhere('reservation.status = :status', { status: status.toUpperCase() });
    } else if (roleUp === 'SUPER_ADMIN' || roleUp === 'CLIENTE' || roleUp === 'USER') {
      // Sin filtro explícito → ocultar canceladas por defecto
      qb.andWhere("reservation.status != :cancelled", { cancelled: 'CANCELLED' });
    }

    // Filtro por gymId si se provee
    if (opts.gymId) {
      qb.andWhere('(activity.gym_id = :gymId OR reservation.gym_id = :gymId)', { gymId: opts.gymId });
    }

    // ── Scope por rol ─────────────────────────────────────────────────────────
    this.applyListScope(qb);

    // ── Paginación ────────────────────────────────────────────────────────────
    qb.offset((page - 1) * limit).limit(limit);

    const records = await qb.getMany();
    return records.map((r) => this.mapReservation(r));
  }
  private mapReservation(r: Reservation) {
    let reservationDateStr = r.reservationDate as any;
    if (reservationDateStr instanceof Date) {
      reservationDateStr = reservationDateStr.toISOString().split('T')[0];
    } else if (typeof reservationDateStr === 'string') {
      reservationDateStr = reservationDateStr.split('T')[0];
    }

    const firstName = r.user?.profile?.firstName ?? '';
    const lastName = r.user?.profile?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: r.id,
      userId: r.userId ?? r.user?.id,
      reservationDate: reservationDateStr,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      qrToken: r.qrToken,
      createdAt: r.createdAt,
      cancelledAt: r.cancelledAt,
      user: r.user ? {
        id: r.user.id,
        email: r.user.email,
        profile: r.user.profile ? {
          fullName,
          ci: r.user.profile.ci ?? null,
        } : null,
      } : null,
      gym: r.gym ? {
        id: r.gym.id,
        name: r.gym.name,
      } : null,
      freeActivity: r.activity ? {
        id: r.activity.id,
        name: r.activity.name,
        gymId: r.activity.gymId,
      } : null,
      gymActivitySchedule: r.gymActivitySchedule ? {
        id: r.gymActivitySchedule.id,
        dayOfWeek: r.gymActivitySchedule.dayOfWeek,
        startTime: r.gymActivitySchedule.startTime,
        endTime: r.gymActivitySchedule.endTime,
        instructor: r.gymActivitySchedule.instructor ? {
          id: r.gymActivitySchedule.instructor.id,
          email: r.gymActivitySchedule.instructor.email,
          profile: r.gymActivitySchedule.instructor.profile ? {
            firstName: r.gymActivitySchedule.instructor.profile.firstName,
            lastName: r.gymActivitySchedule.instructor.profile.lastName,
          } : null,
        } : null,
        gymActivity: r.gymActivitySchedule.gymActivity ? {
          id: r.gymActivitySchedule.gymActivity.id,
          name: r.gymActivitySchedule.gymActivity.name,
          gymId: r.gymActivitySchedule.gymActivity.gymId,
        } : null,
      } : null,
    };
  }

  async findByUser(userId: number, date?: string) {
    const { role, userId: authUserId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();

    if (roleUp === 'ENTRENADOR') {
      throw new ForbiddenException(
        'Los entrenadores deben usar el endpoint de asistencia por clase.',
      );
    }

    // Candado de aislamiento: CLIENTE/USER solo ve SUS reservas.
    // El controlador ya resuelve userId al JWT para estos roles,
    // pero esta capa de servicio actúa como segunda defensa.
    if (roleUp === 'CLIENTE' || roleUp === 'USER') {
      userId = Number(authUserId); // sobrescribe cualquier valor externo
    } else if (
      roleUp !== 'SUPER_ADMIN' &&
      roleUp !== 'GERENTE' &&
      roleUp !== 'RECEPCIONISTA'
    ) {
      throw new ForbiddenException('No tiene permisos para listar reservas.');
    }

    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user',                'user')
      .leftJoinAndSelect('user.profile',                    'userProfile')
      .leftJoinAndSelect('reservation.gym',                 'gym')
      .leftJoinAndSelect('gym.location',                    'gymLocation')
      .leftJoinAndSelect('reservation.activity',            'freeActivity')
      .addSelect('freeActivity.name')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity',            'activity')
      .addSelect('activity.name')
      .leftJoinAndSelect('schedule.instructor',             'schedInstructor')
      .leftJoinAndSelect('schedInstructor.profile',         'schedInstructorProfile')
      .andWhere('reservation.userId = :userId', { userId })
      .orderBy('reservation.reservationDate', 'DESC');

    if (date) {
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(date.trim());
      if (m) {
        qb.andWhere('reservation.reservationDate = :date', { date: date.trim() });
      }
    }

    if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      const gymId = this.managerGymId();
      qb.andWhere(
        '(activity.gym_id = :gymId OR reservation.gym_id = :gymId)',
        { gymId },
      );
    }

    const records = await qb.getMany();
    return records.map((r) => this.mapReservation(r));
  }

  async findOne(id: number) {
    const qb = this.repo
      .createQueryBuilder('reservation')
      // Usuario
      .leftJoinAndSelect('reservation.user',               'user')
      .leftJoinAndSelect('user.profile',                   'userProfile')
      // Sede
      .leftJoinAndSelect('reservation.gym',                'gym')
      // Flujo libre
      .leftJoinAndSelect('reservation.activity',           'freeActivity')
      .addSelect('freeActivity.name')
      // Flujo programado
      .leftJoinAndSelect('reservation.gymActivitySchedule','schedule')
      .leftJoinAndSelect('schedule.gymActivity',           'activity')       // alias requerido por applyListScope
      .addSelect('activity.name')
      .leftJoinAndSelect('schedule.instructor',            'schedInstructor')
      .leftJoinAndSelect('schedInstructor.profile',        'schedInstructorProfile')
      .where('reservation.id = :id', { id });

    this.applyListScope(qb);

    const r = await qb.getOne();
    if (r) return this.mapReservation(r);

    const { role } = this.getAuthUser();
    const roleUp = role?.toUpperCase();
    const exists = await this.repo.exist({ where: { id } });
    if (
      exists &&
      (roleUp === 'GERENTE' || roleUp === 'CLIENTE' || roleUp === 'USER')
    ) {
      throw new ForbiddenException('No tiene permisos para acceder a esta reserva');
    }

    throw new NotFoundException(`Reserva ${id} no encontrada`);
  }

  async findByToken(token: string) {
    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('user.profile', 'userProfile')
      .leftJoinAndSelect('reservation.gym', 'gym')
      .leftJoinAndSelect('reservation.activity', 'freeActivity')
      .addSelect('freeActivity.name')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .addSelect('activity.name')
      .leftJoinAndSelect('schedule.instructor', 'schedInstructor')
      .leftJoinAndSelect('schedInstructor.profile', 'schedInstructorProfile')
      .where('reservation.qrToken = :token', { token });

    const r = await qb.getOne();
    if (!r) throw new NotFoundException('Token QR inválido o reserva no encontrada');
    
    // Auth scope check
    const { role } = this.getAuthUser();
    const roleUp = role?.toUpperCase();
    if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      const managerGymId = this.managerGymId();
      const reservationGymId = r.gymId ?? r.gymActivitySchedule?.gymActivity?.gymId;
      if (Number(reservationGymId) !== Number(managerGymId)) {
        throw new ForbiddenException('Esta reserva pertenece a otra sucursal.');
      }
    } else if (roleUp === 'CLIENTE' || roleUp === 'USER') {
       throw new ForbiddenException('No tiene permisos para validar reservas por token.');
    }

    return this.mapReservation(r);
  }


  /**
   * Valida QR y marca ingreso físico.
   * Solo GERENTE (misma sede) o SUPER_ADMIN.
   * Reserva debe estar en estado CONFIRMADA → pasa a COMPLETADA.
   * Registra fila en check_ins.
   */
  async checkInReservation(reservationId: number): Promise<{ reservation: Reservation; checkIn: CheckIn }> {
    const { role, userId, gymId: tokenGymId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();

    if (roleUp !== 'GERENTE' && roleUp !== 'RECEPCIONISTA' && roleUp !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo GERENTE, RECEPCIONISTA o SUPER_ADMIN pueden registrar ingresos.');
    }

    // Cargar reserva con todas las relaciones necesarias (libre y programada)
    const reservation = await this.repo.findOne({
      where: { id: reservationId },
      relations: ['gymActivitySchedule', 'gymActivitySchedule.gymActivity', 'activity'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada.`);
    }

    // Validación multitenant: GERENTE/RECEPCIONISTA solo pueden hacer check-in en su sede.
    if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      const managerGymId = this.managerGymId();
      const reservationGymId =
        reservation.gymId ??
        reservation.gymActivitySchedule?.gymActivity?.gymId;
      if (Number(reservationGymId) !== Number(managerGymId)) {
        throw new ForbiddenException(
          'Esta reserva pertenece a una sucursal distinta. Acceso denegado.',
        );
      }
    }

    // Solo se puede hacer check-in de reservas confirmadas
    if (reservation.status !== 'CONFIRMADA') {
      throw new BadRequestException(
        `La reserva tiene estado '${reservation.status}'. Solo se puede hacer check-in de reservas CONFIRMADA.`,
      );
    }

    // Mutación de estado
    reservation.status = 'COMPLETADA';

    // Gymid para el check_in: usa el de la reserva o el del token (GERENTE)
    const gymIdForCheckIn =
      reservation.gymActivitySchedule?.gymActivity?.gymId ??
      Number(tokenGymId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedReservation = await queryRunner.manager.save(Reservation, reservation);

      const checkIn = queryRunner.manager.create(CheckIn, {
        userId: reservation.userId,
        gymId: gymIdForCheckIn,
        method: 'QR',
        status: 'COMPLETED',
        checkInTime: new Date(),
      });
      const savedCheckIn = await queryRunner.manager.save(CheckIn, checkIn);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Check-in QR: reserva=${reservationId} user=${reservation.userId} gym=${gymIdForCheckIn} by=${userId}`,
      );

      return { reservation: savedReservation, checkIn: savedCheckIn };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al procesar el check-in', {
        cause: error instanceof Error ? error : undefined,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check-in seguro por JWT efímero del QR.
   * Orden estricto:
   *   1. verify() → lanza automáticamente si el JWT expiró o es inválido
   *   2. Extraer sub (reservationId) del payload
   *   3. Validar fecha: la reserva debe ser HOY (UTC)
   *   4. Abrir transacción + pessimistic_write por ID
   *   5. Validación de sucursal dentro del lock
   *   6. Estado CONFIRMADA dentro del lock
   *   7. Mutación atómica → COMPLETADA + CheckIn
   */
  async checkInByToken(
    token: string,
  ): Promise<{ reservation: Reservation; checkIn: CheckIn }> {
    const { role, userId, gymId: tokenGymId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();

    if (roleUp !== 'GERENTE' && roleUp !== 'RECEPCIONISTA' && roleUp !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo GERENTE, RECEPCIONISTA o SUPER_ADMIN pueden registrar ingresos.');
    }

    // ── 1. Verificar JWT — lanza JsonWebTokenError / TokenExpiredError si inválido ──
    let payload: { sub: number; gymId: number; type?: string };
    try {
      payload = this.jwtService.verify<{ sub: number; gymId: number; type?: string }>(token);
    } catch {
      throw new BadRequestException('QR inválido o expirado. Solicita uno nuevo desde la app.');
    }

    if (payload.type !== 'QR_CHECK_IN') {
      throw new BadRequestException('El token no es un QR de check-in.');
    }

    const reservationId = Number(payload.sub);

    // ── 2. Calcular HOY en UTC (YYYY-MM-DD) antes de abrir la transacción ────
    const todayUtc = new Date().toISOString().slice(0, 10);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── 3. Lock pesimista por ID extraído del JWT (no por qrToken estático) ──
      const locked = await queryRunner.manager.findOne(Reservation, {
        where: { id: reservationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new NotFoundException('Reserva no encontrada.');
      }

      // ── 4. Cargar relaciones con la fila ya bloqueada ─────────────────────
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: locked.id },
        relations: ['gymActivitySchedule', 'gymActivitySchedule.gymActivity'],
      });

      if (!reservation) {
        throw new NotFoundException('Reserva no encontrada.');
      }

      // ── 5. Validación de FECHA: la reserva debe ser para HOY ──────────────
      const reservationDateStr =
        reservation.reservationDate instanceof Date
          ? reservation.reservationDate.toISOString().slice(0, 10)
          : String(reservation.reservationDate).slice(0, 10);

      if (reservationDateStr !== todayUtc) {
        throw new BadRequestException('La reserva no es válida para el día de hoy.');
      }

      // ── 6. Validación de sucursal estricta (anti-fraude cruzado) ──────────
      if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
        const managerGymId = this.managerGymId();
        const reservationGymId =
          reservation.gymId ??
          reservation.gymActivitySchedule?.gymActivity?.gymId ?? null;

        if (Number(reservationGymId) !== Number(managerGymId)) {
          throw new ForbiddenException('El QR pertenece a otra sucursal.');
        }
      }

      // ── 7. Verificar estado DENTRO del lock (anti race condition) ──────────
      if (reservation.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          `Estado '${reservation.status}'. Solo se puede hacer check-in de reservas CONFIRMADA.`,
        );
      }

      // ── 8. Mutación atómica ────────────────────────────────────────────────
      reservation.status = 'COMPLETADA';
      const savedReservation = await queryRunner.manager.save(Reservation, reservation);

      const gymIdForCheckIn =
        reservation.gymId ??
        reservation.gymActivitySchedule?.gymActivity?.gymId ??
        Number(tokenGymId);

      const checkIn = queryRunner.manager.create(CheckIn, {
        userId:      reservation.userId,
        gymId:       gymIdForCheckIn,
        method:      'QR',
        status:      'COMPLETED',
        checkInTime: new Date(),
      });
      const savedCheckIn = await queryRunner.manager.save(CheckIn, checkIn);

      await queryRunner.commitTransaction();

      this.logger.log(
        `[QR-JWT] Check-in: reserva=${reservation.id} user=${reservation.userId} gym=${gymIdForCheckIn} by=${userId}`,
      );

      return { reservation: savedReservation, checkIn: savedCheckIn };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al procesar el check-in', {
        cause: error instanceof Error ? error : undefined,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Genera un JWT efímero (3 min) para el QR de check-in.
   * Solo el dueño de la reserva puede pedirlo y solo si está CONFIRMADA.
   */
  async getQrToken(reservationId: number): Promise<{ qrToken: string }> {
    const { userId } = this.getAuthUser();

    const reservation = await this.repo.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada.`);
    }
    if (Number(reservation.userId) !== Number(userId)) {
      throw new ForbiddenException('Solo puedes obtener el QR de tus propias reservas.');
    }
    if (reservation.status !== 'CONFIRMADA') {
      throw new BadRequestException(
        `La reserva tiene estado '${reservation.status}'. Solo reservas CONFIRMADA generan QR.`,
      );
    }

    const qrToken = this.jwtService.sign(
      { sub: reservation.id, gymId: reservation.gymId, type: 'QR_CHECK_IN' },
      { expiresIn: '3m' },   // ← expira en 3 minutos exactos
    );

    return { qrToken };
  }

  /**
   * Busca gerentes con pushToken asignados al gymId y les envía
   * una notificación Expo. Fire-and-forget: nunca bloquea la respuesta.
   */
  private async notifyGymManagers(gymId: number, reservationId?: number): Promise<void> {
    try {
      const tokens = await this.usersService.getManagerPushTokens(gymId);
      tokens.forEach((token) => {
        this.pushService
          .sendPushMessage(token, 'Nueva Reserva', 'Tienes una nueva reserva confirmada en tu sucursal.')
          .catch(() => {});
      });
      if (tokens.length > 0) {
        this.logger.log(`[PUSH] ${tokens.length} gerente(s) notificado(s) en gym=${gymId}`);
      }

      // Emisión en tiempo real para la Web
      this.gymGateway.emitToGym(gymId, 'new_reservation', {
        message: 'Tienes una nueva reserva confirmada',
        reservationId,
        gymId,
      });
    } catch (err) {
      this.logger.warn(`[PUSH] Error notificando gerentes de gym=${gymId}: ${String(err)}`);
    }
  }

  async bulkUpdateStatus(ids: number[], status: 'COMPLETADA' | 'FALTO'): Promise<void> {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder()
      .update(Reservation)
      .set({ status })
      .where('id IN (:...ids)', { ids });
    if (mg !== null) {
      qb.andWhere('gym_id = :gymId', { gymId: mg });
    }
    await qb.execute();
  }

  async createWalkIn(userId: number, scheduleId: number): Promise<Reservation> {
    const { userId: actorId } = this.getAuthUser();
    const schedule = await this.scheduleRepo.findOne({
      where: { id: scheduleId },
      relations: ['gymActivity'],
    });
    if (!schedule) throw new NotFoundException(`Horario ${scheduleId} no encontrado.`);

    const mg = this.managerGymId();
    if (mg !== null && schedule.gymActivity.gymId !== mg) {
      throw new ForbiddenException('El horario pertenece a otra sucursal.');
    }

    const today = new Date().toISOString().split('T')[0];

    const entity = this.repo.create({
      userId,
      gymActivityScheduleId: scheduleId,
      gymId:                 schedule.gymActivity.gymId,
      activityId:            schedule.gymActivity.id,
      reservationDate:       this.parseReservationDateOnly(today),
      startTime:             String(schedule.startTime).slice(0, 5),
      endTime:               String(schedule.endTime).slice(0, 5),
      status:                'COMPLETADA',
      createdBy:             Number(actorId),
      qrToken:               randomUUID(),
    });

    return this.repo.save(entity);
  }

  async cancel(id: number) {
    const { role, userId, gymId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();
    const r = await this.repo.findOne({ 
      where: { id },
      relations: ['gymActivitySchedule', 'gymActivitySchedule.gymActivity']
    });

    if (!r) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (roleUp === 'CLIENTE' || roleUp === 'USER') {
      if (r.userId !== Number(userId)) {
        throw new ForbiddenException('No puedes cancelar reservas ajenas.');
      }
    } else if (roleUp === 'GERENTE') {
      const reservationGymId = r.gymActivitySchedule?.gymActivity?.gymId;
      if (Number(reservationGymId) !== Number(gymId)) {
        throw new ForbiddenException(
          'Esta reserva pertenece a otra sede corporativa',
        );
      }
    }

    r.status = 'CANCELLED';
    r.cancelledAt = new Date();
    const saved = await this.repo.save(r);
    // Reload full relations for mapped response
    return this.findOne(saved.id);
  }
  async confirm(id: number) {
    const { role, gymId } = this.getAuthUser();
    const roleUp = role?.toUpperCase();

    if (roleUp !== 'GERENTE' && roleUp !== 'RECEPCIONISTA' && roleUp !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo el staff puede confirmar el ingreso.');
    }

    const r = await this.repo.findOne({
      where: { id },
      relations: ['gymActivitySchedule', 'gymActivitySchedule.gymActivity']
    });

    if (!r) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA') {
      const reservationGymId = r.gymId ?? r.gymActivitySchedule?.gymActivity?.gymId;
      if (Number(reservationGymId) !== Number(gymId)) {
        throw new ForbiddenException('Esta reserva pertenece a otra sede corporativa.');
      }
    }

    if (r.status === 'COMPLETADA' || r.status === 'CANCELADA') {
      throw new BadRequestException(`La reserva ya se encuentra ${r.status}`);
    }

    r.status = 'COMPLETADA';
    const saved = await this.repo.save(r);
    return this.findOne(saved.id);
  }
}
