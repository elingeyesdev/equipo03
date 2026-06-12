import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { NutritionalAppointment } from '../domain/nutritional-appointment.entity';
import { Reservation } from '../../reservations/domain/reservation.entity';
import { StaffSchedule } from '../domain/staff-schedule.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
import {
  DayOfWeek,
  aliasesForCanonicalDay,
} from '../../activities/application/dtos/create-activity-schedule.dto';

/** Índice UTC → nombre español del día (mismo orden que Date.getUTCDay). */
const DAY_UTC: DayOfWeek[] = [
  DayOfWeek.DOMINGO,
  DayOfWeek.LUNES,
  DayOfWeek.MARTES,
  DayOfWeek.MIERCOLES,
  DayOfWeek.JUEVES,
  DayOfWeek.VIERNES,
  DayOfWeek.SABADO,
];

@Injectable({ scope: Scope.REQUEST })
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectRepository(GymActivitySchedule)
    private scheduleRepo: Repository<GymActivitySchedule>,
    @InjectRepository(NutritionalAppointment)
    private appointmentRepo: Repository<NutritionalAppointment>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(StaffSchedule)
    private staffScheduleRepo: Repository<StaffSchedule>,
    @InjectRepository(Gym)
    private gymRepo: Repository<Gym>,
    @InjectRepository(GymSchedule)
    private gymScheduleRepo: Repository<GymSchedule>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private static readonly DAY_NAMES = [
    'DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO',
  ];

  private toHHmm(t: string): string {
    return t.slice(0, 5); // normaliza HH:mm:ss → HH:mm
  }

  private async validateAgainstGymSchedules(
    gymId: number,
    slots: { dayOfWeek: number; startTime: string; endTime: string }[],
  ): Promise<void> {
    const gymSchedules = await this.gymScheduleRepo.find({ where: { gymId } });

    for (const slot of slots) {
      const canonical = DAY_UTC[slot.dayOfWeek];
      const aliases   = aliasesForCanonicalDay(canonical); // e.g. ['DOMINGO', 'DOM']
      const dayName   = StaffService.DAY_NAMES[slot.dayOfWeek]; // para mensajes de error
      const gymDay    = gymSchedules.find(
        (gs) => aliases.includes(gs.dayOfWeek.toUpperCase()),
      );

      if (!gymDay) {
        throw new BadRequestException(
          `La sucursal (ID ${gymId}) no tiene horario operativo registrado para ${dayName}. ` +
          `Configura primero el horario de atención de la sucursal en el módulo de Sedes.`,
        );
      }

      if (gymDay.isHoliday) {
        throw new BadRequestException(
          `${dayName} está marcado como día festivo o no operativo en esta sucursal. ` +
          `No se pueden asignar turnos de personal en días no operativos.`,
        );
      }

      const gymOpens  = this.toHHmm(gymDay.opensAt);
      const gymCloses = this.toHHmm(gymDay.closesAt);

      if (slot.startTime < gymOpens || slot.endTime > gymCloses) {
        throw new BadRequestException(
          `Turno inválido el ${dayName}: ${slot.startTime}–${slot.endTime} está fuera del horario ` +
          `de atención de la sucursal (${gymOpens}–${gymCloses}). ` +
          `Ajusta el turno para que quede dentro del horario operativo.`,
        );
      }
    }
  }

  private async validateManagerScope(managerGymId: number, targetGymId: number): Promise<void> {
    if (managerGymId === targetGymId) return;
    const [managerGym, targetGym] = await Promise.all([
      this.gymRepo.findOne({ where: { id: managerGymId } }),
      this.gymRepo.findOne({ where: { id: targetGymId } }),
    ]);
    // brandId del gerente: si su sede tiene parentId, ese es la marca; sino, él mismo es la marca
    const brandId = managerGym?.parentId ?? managerGymId;
    if (targetGym?.parentId !== brandId && targetGym?.id !== brandId) {
      throw new ForbiddenException(
        `La sucursal "${targetGym?.name ?? '#' + targetGymId}" no pertenece a tu marca (ID ${brandId}). ` +
        `Solo puedes asignar horarios a empleados que trabajan en tus propias sucursales.`,
      );
    }
  }

  async assignSchedule(
    managerGymId: number,
    targetUserId: number,
    gymId: number,
    slots: { dayOfWeek: number; startTime: string; endTime: string }[],
    skipScopeCheck = false,
  ): Promise<StaffSchedule[]> {
    if (!skipScopeCheck) {
      await this.validateManagerScope(managerGymId, gymId);
    }
    await this.validateAgainstGymSchedules(gymId, slots);
    await this.staffScheduleRepo.delete({ userId: targetUserId, gymId });
    const rows = slots.map((s) =>
      this.staffScheduleRepo.create({ userId: targetUserId, gymId, ...s }),
    );
    return this.staffScheduleRepo.save(rows);
  }

  getStaffSchedules(targetUserId: number): Promise<StaffSchedule[]> {
    return this.staffScheduleRepo.find({
      where: { userId: targetUserId },
      relations: ['gym'],
      order: { gymId: 'ASC', dayOfWeek: 'ASC' },
    });
  }

  async getMySchedules(): Promise<{
    id: number;
    className: string;
    gymName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    enrolledCount: number;
    attendees: { id: number | null; fullName: string }[];
  }[]> {
    const userId   = this.getAuthUserId();
    const todayDay = DAY_UTC[new Date().getUTCDay()];
    const aliases  = aliasesForCanonicalDay(todayDay);

    this.logger.debug(
      `[getMySchedules] userId=${userId} día=${todayDay} aliases=${aliases.join(',')}`,
    );

    const rows = await this.scheduleRepo
      .createQueryBuilder('sched')
      .select('sched.id',              'id')
      .addSelect('act.name',           'className')
      .addSelect('gym.name',           'gymName')
      .addSelect('sched.dayOfWeek',    'dayOfWeek')
      .addSelect('sched.startTime',    'startTime')
      .addSelect('sched.endTime',      'endTime')
      .addSelect('sched.maxAttendees', 'maxCapacity')
      .addSelect(
        `(SELECT COUNT(*) FROM reservations r
            WHERE r.gym_activity_schedule_id = sched.id
              AND r.reservation_date = CURRENT_DATE
              AND r.status = 'COMPLETADA')`,
        'enrolledCount',
      )
      .innerJoin('sched.gymActivity', 'act')
      .innerJoin('act.gym', 'gym')
      .where('sched.instructorId = :userId', { userId })
      .andWhere('UPPER(sched.dayOfWeek) IN (:...aliases)', { aliases })
      .groupBy('sched.id')
      .addGroupBy('act.name')
      .addGroupBy('gym.name')
      .addGroupBy('sched.dayOfWeek')
      .addGroupBy('sched.startTime')
      .addGroupBy('sched.endTime')
      .addGroupBy('sched.maxAttendees')
      .orderBy('sched.startTime', 'ASC')
      .getRawMany();

    this.logger.debug(
      `[getMySchedules] schedules encontrados: ${rows.length}` +
      (rows.length ? ` | ids=[${rows.map((r) => r.id).join(',')}]` : ' → ¿instructor_id coincide con el userId del token?'),
    );

    if (rows.length === 0) return [];

    const scheduleIds = rows.map((r) => Number(r.id));

    const reservations = await this.reservationRepo
      .createQueryBuilder('res')
      .leftJoinAndSelect('res.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('res.gymActivityScheduleId IN (:...scheduleIds)', { scheduleIds })
      .andWhere('res.reservationDate = CURRENT_DATE')
      .andWhere("res.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA')")
      .getMany();

    this.logger.debug(
      `[getMySchedules] reservas hoy para scheduleIds=[${scheduleIds.join(',')}]: ${reservations.length}` +
      (reservations.length === 0 ? ' → BD vacía para hoy o status no coincide' : ''),
    );

    const bySchedule = new Map<number, typeof reservations>();
    for (const res of reservations) {
      const sid = res.gymActivityScheduleId!;
      if (!bySchedule.has(sid)) bySchedule.set(sid, []);
      bySchedule.get(sid)!.push(res);
    }

    // Bolivia = UTC-4 (sin horario de verano)
    const nowBoliviaHHmm = new Date(Date.now() - 4 * 60 * 60 * 1000)
      .toISOString()
      .slice(11, 16); // 'HH:mm'

    return rows.map((r) => {
      const endHHmm       = String(r.endTime).slice(0, 5);
      const classEnded    = endHHmm <= nowBoliviaHHmm;
      const slotReservations = bySchedule.get(Number(r.id)) ?? [];
      return {
        id:            Number(r.id),
        className:     r.className as string,
        gymName:       r.gymName as string,
        dayOfWeek:     r.dayOfWeek as string,
        startTime:     String(r.startTime).slice(0, 5),
        endTime:       endHHmm,
        maxCapacity:   Number(r.maxCapacity),
        enrolledCount: classEnded ? 0 : Number(r.enrolledCount),
        attendees: slotReservations.map((res) => ({
          id: res.user?.id ?? null,
          fullName:
            [res.user?.profile?.firstName, res.user?.profile?.lastName]
              .filter(Boolean)
              .join(' ') || (res.user?.email ?? ''),
        })),
      };
    });
  }

  async getAttendanceStats(): Promise<{
    scheduleId: number;
    time: string;
    className: string;
    totalCompleted: number;
  }[]> {
    const userId = this.getAuthUserId();

    const rows = await this.reservationRepo
      .createQueryBuilder('res')
      .select('sched.id',           'scheduleId')
      .addSelect('sched.startTime', 'time')
      .addSelect('act.name',        'className')
      .addSelect('COUNT(res.id)',   'totalCompleted')
      .innerJoin('res.gymActivitySchedule', 'sched')
      .innerJoin('sched.gymActivity',       'act')
      .where('sched.instructorId = :userId', { userId })
      .andWhere("res.status = 'COMPLETADA'")
      .andWhere("res.reservationDate >= CURRENT_DATE - INTERVAL '30 days'")
      .groupBy('sched.id')
      .addGroupBy('sched.startTime')
      .addGroupBy('act.name')
      .orderBy('sched.startTime', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      scheduleId:     Number(r.scheduleId),
      time:           String(r.time).slice(0, 5),
      className:      r.className as string,
      totalCompleted: Number(r.totalCompleted),
    }));
  }

  async getMyStudents(): Promise<{
    reservationId: number;
    clientName: string;
    className: string;
    startTime: string;
    endTime: string;
    reservationDate: string;
  }[]> {
    const userId = this.getAuthUserId();

    const rows = await this.reservationRepo
      .createQueryBuilder('res')
      .select('res.id',                 'reservationId')
      .addSelect('res.reservationDate', 'reservationDate')
      .addSelect(
        `COALESCE(res.start_time, sched.start_time)`,
        'startTime',
      )
      .addSelect(
        `COALESCE(res.end_time, sched.end_time)`,
        'endTime',
      )
      .addSelect('act.name',             'className')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'clientName',
      )
      .addSelect('client.email',         'clientEmail')
      .innerJoin('res.gymActivitySchedule', 'sched')
      .innerJoin('sched.gymActivity',       'act')
      .innerJoin('res.user',                'client')
      .leftJoin('client.profile',           'prof')
      .where('sched.instructorId = :userId', { userId })
      .andWhere("res.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA')")
      .orderBy('res.reservationDate', 'DESC')
      .addOrderBy('sched.startTime',   'ASC')
      .getRawMany();

    return rows.map((r) => ({
      reservationId:   Number(r.reservationId),
      clientName:      (r.clientName as string).trim() || (r.clientEmail as string ?? ''),
      className:       r.className as string,
      startTime:       r.startTime ? String(r.startTime).slice(0, 5) : '',
      endTime:         r.endTime   ? String(r.endTime).slice(0, 5)   : '',
      reservationDate: new Date(r.reservationDate as string).toISOString(),
    }));
  }

  private getAuthUserId(): number {
    const user = this.request.user;
    if (!user?.userId) throw new ForbiddenException('Sesión inválida.');
    return Number(user.userId);
  }

  /**
   * Clases de HOY asignadas al entrenador/instructor autenticado.
   * Incluye enrolledCount (subquery) + array de reservas con perfil de alumno.
   */
  async getTodayClasses() {
    const userId  = this.getAuthUserId();
    const todayDay = DAY_UTC[new Date().getUTCDay()];
    const aliases  = aliasesForCanonicalDay(todayDay);

    const rows = await this.scheduleRepo
      .createQueryBuilder('sched')
      .select('sched.id',              'id')
      .addSelect('sched.startTime',    'startTime')
      .addSelect('sched.endTime',      'endTime')
      .addSelect('act.name',           'className')
      .addSelect('sched.maxAttendees', 'maxAttendees')
      .addSelect(
        `(SELECT COUNT(*) FROM reservations r
            WHERE r.gym_activity_schedule_id = sched.id
              AND r.reservation_date = CURRENT_DATE
              AND r.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA'))`,
        'enrolledCount',
      )
      .innerJoin('sched.gymActivity', 'act')
      .where('sched.instructorId = :userId', { userId })
      .andWhere('UPPER(sched.dayOfWeek) IN (:...aliases)', { aliases })
      .orderBy('sched.startTime', 'ASC')
      .getRawMany();

    if (rows.length === 0) return [];

    const scheduleIds = rows.map((r) => Number(r.id));

    const reservations = await this.reservationRepo
      .createQueryBuilder('res')
      .leftJoinAndSelect('res.user',    'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('res.gymActivityScheduleId IN (:...scheduleIds)', { scheduleIds })
      .andWhere('res.reservationDate = CURRENT_DATE')
      .andWhere("res.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA')")
      .getMany();

    const bySchedule = new Map<number, typeof reservations>();
    for (const res of reservations) {
      const sid = res.gymActivityScheduleId!;
      if (!bySchedule.has(sid)) bySchedule.set(sid, []);
      bySchedule.get(sid)!.push(res);
    }

    return rows.map((r) => ({
      id:            Number(r.id),
      startTime:     String(r.startTime).slice(0, 5),
      endTime:       String(r.endTime).slice(0, 5),
      className:     r.className as string,
      maxAttendees:  Number(r.maxAttendees),
      enrolledCount: Number(r.enrolledCount),
      reservations:  (bySchedule.get(Number(r.id)) ?? []).map((res) => ({
        id:     res.id,
        status: res.status,
        userId: res.userId,
        user: {
          id:        res.user?.id        ?? null,
          email:     res.user?.email     ?? null,
          firstName: res.user?.profile?.firstName ?? null,
          lastName:  res.user?.profile?.lastName  ?? null,
          avatarUrl: res.user?.profile?.avatarUrl  ?? null,
        },
      })),
    }));
  }

  async getMyAppointments(todayOnly = false) {
    const userId = this.getAuthUserId();

    const qb = this.appointmentRepo
      .createQueryBuilder('apt')
      .innerJoinAndSelect('apt.patient', 'patient')
      .leftJoinAndSelect('patient.profile', 'profile')
      .where('apt.nutritionistId = :userId', { userId })
      .orderBy('apt.date', 'DESC')
      .addOrderBy('apt.startTime', 'ASC');

    if (todayOnly) {
      qb.andWhere('apt.date = CURRENT_DATE');
    }

    const rows = await qb.getMany();

    return rows.map((apt) => ({
      id:              apt.id,
      date:            apt.date,
      startTime:       apt.startTime,
      appointmentType: apt.appointmentType,
      status:          apt.status,
      notes:           apt.notes,
      patient: {
        id:        apt.patient.id,
        email:     apt.patient.email,
        firstName: apt.patient.profile?.firstName ?? null,
        lastName:  apt.patient.profile?.lastName  ?? null,
        avatarUrl: apt.patient.profile?.avatarUrl  ?? null,
      },
    }));
  }

  async updateAppointmentStatus(id: number, status: string) {
    const userId = this.getAuthUserId();
    const apt = await this.appointmentRepo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException(`Cita ${id} no encontrada.`);
    if (apt.nutritionistId !== userId) {
      throw new ForbiddenException('No tiene permisos para modificar esta cita.');
    }
    apt.status = status;
    return this.appointmentRepo.save(apt);
  }

  /**
   * Citas nutricionales de HOY para el nutricionista autenticado.
   */
  async getTodayAppointments(): Promise<{
    id: number;
    startTime: string;
    appointmentType: string;
    status: string;
    patientName: string;
  }[]> {
    const userId = this.getAuthUserId();

    const rows = await this.appointmentRepo
      .createQueryBuilder('apt')
      .select('apt.id',              'id')
      .addSelect('apt.startTime',    'startTime')
      .addSelect('apt.appointmentType', 'appointmentType')
      .addSelect('apt.status',       'status')
      .addSelect("CONCAT(prof.first_name, ' ', prof.last_name)", 'patientName')
      .innerJoin('apt.patient',  'patient')
      .innerJoin('patient.profile', 'prof')
      .where('apt.nutritionistId = :userId', { userId })
      .andWhere('apt.date = CURRENT_DATE')
      .orderBy('apt.startTime', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      id:              Number(r.id),
      startTime:       String(r.startTime).slice(0, 5),
      appointmentType: r.appointmentType as string,
      status:          r.status as string,
      patientName:     r.patientName as string,
    }));
  }
}
