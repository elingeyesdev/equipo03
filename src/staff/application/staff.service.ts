import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
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
import { User } from '../../users/domain/user.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { ClientAdvisor } from '../domain/client-advisor.entity';
import { UserProfile } from '../../users/domain/user-profile.entity';
import { PhysicalMetricsHistory } from '../../metrics/domain/physical-metrics-history.entity';
import { TrainerPlan } from '../domain/trainer-plan.entity';
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
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(ClientAdvisor)
    private advisorRepo: Repository<ClientAdvisor>,
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,
    @InjectRepository(PhysicalMetricsHistory)
    private metricsRepo: Repository<PhysicalMetricsHistory>,
    @InjectRepository(TrainerPlan)
    private trainerPlanRepo: Repository<TrainerPlan>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private static readonly DAY_NAMES = [
    'DOMINGO',
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
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
      const aliases = aliasesForCanonicalDay(canonical); // e.g. ['DOMINGO', 'DOM']
      const dayName = StaffService.DAY_NAMES[slot.dayOfWeek]; // para mensajes de error
      const gymDay = gymSchedules.find((gs) =>
        aliases.includes(gs.dayOfWeek.toUpperCase()),
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

      const gymOpens = this.toHHmm(gymDay.opensAt);
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

  private async validateManagerScope(
    managerGymId: number,
    targetGymId: number,
  ): Promise<void> {
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

  async getMySchedules(): Promise<
    {
      id: number;
      className: string;
      gymName: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      maxCapacity: number;
      enrolledCount: number;
      attendees: { id: number | null; fullName: string }[];
    }[]
  > {
    const userId = this.getAuthUserId();
    const todayDay = DAY_UTC[new Date().getUTCDay()];
    const aliases = aliasesForCanonicalDay(todayDay);

    const rows = await this.scheduleRepo
      .createQueryBuilder('sched')
      .select('sched.id', 'id')
      .addSelect('act.name', 'className')
      .addSelect('gym.name', 'gymName')
      .addSelect('sched.dayOfWeek', 'dayOfWeek')
      .addSelect('sched.startTime', 'startTime')
      .addSelect('sched.endTime', 'endTime')
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
      const endHHmm = String(r.endTime).slice(0, 5);
      const classEnded = endHHmm <= nowBoliviaHHmm;
      const slotReservations = bySchedule.get(Number(r.id)) ?? [];
      return {
        id: Number(r.id),
        className: r.className as string,
        gymName: r.gymName as string,
        dayOfWeek: r.dayOfWeek as string,
        startTime: String(r.startTime).slice(0, 5),
        endTime: endHHmm,
        maxCapacity: Number(r.maxCapacity),
        enrolledCount: classEnded ? 0 : Number(r.enrolledCount),
        attendees: slotReservations.map((res) => ({
          id: res.user?.id ?? null,
          fullName:
            [res.user?.profile?.firstName, res.user?.profile?.lastName]
              .filter(Boolean)
              .join(' ') ||
            (res.user?.email ?? ''),
        })),
      };
    });
  }

  async getMyWeeklySchedules(): Promise<
    {
      id: number;
      activityName: string;
      gymName: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      maxCapacity: number;
      enrolledCount: number;
      attendees: { id: number | null; fullName: string }[];
    }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.scheduleRepo
      .createQueryBuilder('sched')
      .select('sched.id', 'id')
      .addSelect('act.name', 'activityName')
      .addSelect('gym.name', 'gymName')
      .addSelect('sched.dayOfWeek', 'dayOfWeek')
      .addSelect('sched.startTime', 'startTime')
      .addSelect('sched.endTime', 'endTime')
      .addSelect('sched.maxAttendees', 'maxCapacity')
      .addSelect(
        `(SELECT COUNT(*) FROM reservations r
            WHERE r.gym_activity_schedule_id = sched.id
              AND r.reservation_date = CURRENT_DATE
              AND r.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA'))`,
        'enrolledCount',
      )
      .innerJoin('sched.gymActivity', 'act')
      .innerJoin('act.gym', 'gym')
      .where('sched.instructorId = :userId', { userId })
      .groupBy('sched.id')
      .addGroupBy('act.name')
      .addGroupBy('gym.name')
      .addGroupBy('sched.dayOfWeek')
      .addGroupBy('sched.startTime')
      .addGroupBy('sched.endTime')
      .addGroupBy('sched.maxAttendees')
      .orderBy('sched.dayOfWeek', 'ASC')
      .addOrderBy('sched.startTime', 'ASC')
      .getRawMany();

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

    const bySchedule = new Map<number, typeof reservations>();
    for (const res of reservations) {
      const sid = res.gymActivityScheduleId!;
      if (!bySchedule.has(sid)) bySchedule.set(sid, []);
      bySchedule.get(sid)!.push(res);
    }

    return rows.map((r) => ({
      id: Number(r.id),
      activityName: r.activityName as string,
      gymName: r.gymName as string,
      dayOfWeek: r.dayOfWeek as string,
      startTime: String(r.startTime).slice(0, 5),
      endTime: String(r.endTime).slice(0, 5),
      maxCapacity: Number(r.maxCapacity),
      enrolledCount: Number(r.enrolledCount),
      attendees: (bySchedule.get(Number(r.id)) ?? []).map((res) => ({
        id: res.user?.id ?? null,
        fullName:
          [res.user?.profile?.firstName, res.user?.profile?.lastName]
            .filter(Boolean)
            .join(' ') ||
          (res.user?.email ?? ''),
      })),
    }));
  }

  async getAttendanceStats(): Promise<
    {
      scheduleId: number;
      time: string;
      className: string;
      totalCompleted: number;
    }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.reservationRepo
      .createQueryBuilder('res')
      .select('sched.id', 'scheduleId')
      .addSelect('sched.startTime', 'time')
      .addSelect('act.name', 'className')
      .addSelect('COUNT(res.id)', 'totalCompleted')
      .innerJoin('res.gymActivitySchedule', 'sched')
      .innerJoin('sched.gymActivity', 'act')
      .where('sched.instructorId = :userId', { userId })
      .andWhere("res.status = 'COMPLETADA'")
      .andWhere("res.reservationDate >= CURRENT_DATE - INTERVAL '30 days'")
      .groupBy('sched.id')
      .addGroupBy('sched.startTime')
      .addGroupBy('act.name')
      .orderBy('sched.startTime', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      scheduleId: Number(r.scheduleId),
      time: String(r.time).slice(0, 5),
      className: r.className as string,
      totalCompleted: Number(r.totalCompleted),
    }));
  }

  async getMyStudents(): Promise<
    {
      reservationId: number;
      clientName: string;
      className: string;
      startTime: string;
      endTime: string;
      reservationDate: string;
    }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.reservationRepo
      .createQueryBuilder('res')
      .select('res.id', 'reservationId')
      .addSelect('res.reservationDate', 'reservationDate')
      .addSelect(`COALESCE(res.start_time, sched.start_time)`, 'startTime')
      .addSelect(`COALESCE(res.end_time, sched.end_time)`, 'endTime')
      .addSelect('act.name', 'className')
      .addSelect('client.id', 'clientId')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'clientName',
      )
      .addSelect('client.email', 'clientEmail')
      .innerJoin('res.gymActivitySchedule', 'sched')
      .innerJoin('sched.gymActivity', 'act')
      .innerJoin('res.user', 'client')
      .leftJoin('client.profile', 'prof')
      .where('sched.instructorId = :userId', { userId })
      .andWhere("res.status IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA')")
      .orderBy('res.reservationDate', 'DESC')
      .addOrderBy('sched.startTime', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      reservationId: Number(r.reservationId),
      clientId: Number(r.clientId),
      clientName:
        (r.clientName as string).trim() || ((r.clientEmail as string) ?? ''),
      className: r.className as string,
      startTime: r.startTime ? String(r.startTime).slice(0, 5) : '',
      endTime: r.endTime ? String(r.endTime).slice(0, 5) : '',
      reservationDate: new Date(r.reservationDate as string).toISOString(),
    }));
  }

  async getMyAdvisorRequests(): Promise<
    {
      id: number;
      advisorId: number;
      advisorName: string;
      advisorRole: string;
      branchName: string;
      status: string;
      createdAt: string;
    }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.advisorRepo
      .createQueryBuilder('ca')
      .select('ca.id', 'id')
      .addSelect('ca.advisorId', 'advisorId')
      .addSelect('ca.status', 'status')
      .addSelect('ca.createdAt', 'createdAt')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'advisorName',
      )
      .addSelect('adv.email', 'advisorEmail')
      .addSelect('ro.name', 'advisorRole')
      .addSelect('gym.name', 'branchName')
      .innerJoin('ca.advisor', 'adv')
      .leftJoin('adv.profile', 'prof')
      .leftJoin('adv.userRoles', 'ur')
      .leftJoin('ur.role', 'ro')
      .leftJoin('ur.gym', 'gym')
      .where('ca.clientId = :userId', { userId })
      .orderBy('ca.createdAt', 'DESC')
      .getRawMany();

    // De-duplicate: one row per request ID (multiple roles on advisor cause repeated rows)
    const seen = new Set<number>();
    const result: {
      id: number;
      advisorId: number;
      advisorName: string;
      advisorRole: string;
      branchName: string;
      status: string;
      createdAt: string;
    }[] = [];

    for (const r of rows) {
      const id = Number(r.id);
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        advisorId:   Number(r.advisorId),
        advisorName: (r.advisorName as string)?.trim() || (r.advisorEmail as string) || '—',
        advisorRole: (r.advisorRole as string) || '—',
        branchName:  (r.branchName as string)  || '—',
        status:      r.status as string,
        createdAt:   new Date(r.createdAt as string).toISOString(),
      });
    }

    return result;
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
    const userId = this.getAuthUserId();
    const todayDay = DAY_UTC[new Date().getUTCDay()];
    const aliases = aliasesForCanonicalDay(todayDay);

    const rows = await this.scheduleRepo
      .createQueryBuilder('sched')
      .select('sched.id', 'id')
      .addSelect('sched.startTime', 'startTime')
      .addSelect('sched.endTime', 'endTime')
      .addSelect('act.name', 'activityName')
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
      .leftJoinAndSelect('res.user', 'user')
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
      id: Number(r.id),
      startTime: String(r.startTime).slice(0, 5),
      endTime: String(r.endTime).slice(0, 5),
      activityName: r.activityName as string,
      maxAttendees: Number(r.maxAttendees),
      enrolledCount: Number(r.enrolledCount),
      reservations: (bySchedule.get(Number(r.id)) ?? []).map((res) => ({
        id: res.id,
        status: res.status,
        userId: res.userId,
        user: {
          id: res.user?.id ?? null,
          email: res.user?.email ?? null,
          firstName: res.user?.profile?.firstName ?? null,
          lastName: res.user?.profile?.lastName ?? null,
          avatarUrl: res.user?.profile?.avatarUrl ?? null,
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
      id: apt.id,
      date: apt.date,
      startTime: apt.startTime,
      appointmentType: apt.appointmentType,
      status: apt.status,
      notes: apt.notes,
      patient: {
        id: apt.patient.id,
        email: apt.patient.email,
        firstName: apt.patient.profile?.firstName ?? null,
        lastName: apt.patient.profile?.lastName ?? null,
        avatarUrl: apt.patient.profile?.avatarUrl ?? null,
      },
    }));
  }

  async updateAppointmentStatus(id: number, status: string) {
    const userId = this.getAuthUserId();
    const apt = await this.appointmentRepo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException(`Cita ${id} no encontrada.`);
    if (apt.nutritionistId !== userId) {
      throw new ForbiddenException(
        'No tiene permisos para modificar esta cita.',
      );
    }
    apt.status = status;
    return this.appointmentRepo.save(apt);
  }

  /**
   * Citas nutricionales de HOY para el nutricionista autenticado.
   */
  async getTodayAppointments(): Promise<
    {
      id: number;
      startTime: string;
      appointmentType: string;
      status: string;
      patientName: string;
    }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.appointmentRepo
      .createQueryBuilder('apt')
      .select('apt.id', 'id')
      .addSelect('apt.startTime', 'startTime')
      .addSelect('apt.appointmentType', 'appointmentType')
      .addSelect('apt.status', 'status')
      .addSelect("CONCAT(prof.first_name, ' ', prof.last_name)", 'patientName')
      .innerJoin('apt.patient', 'patient')
      .innerJoin('patient.profile', 'prof')
      .where('apt.nutritionistId = :userId', { userId })
      .andWhere('apt.date = CURRENT_DATE')
      .orderBy('apt.startTime', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      startTime: String(r.startTime).slice(0, 5),
      appointmentType: r.appointmentType as string,
      status: r.status as string,
      patientName: r.patientName as string,
    }));
  }

  async getCatalog(): Promise<
    {
      id: number;
      fullName: string;
      role: string;
      branchName: string;
      brandName: string;
      specialty: string;
    }[]
  > {
    const users = await this.userRepo
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.userRoles', 'ur')
      .innerJoinAndSelect('ur.role', 'ro')
      .leftJoinAndSelect('u.profile', 'prof')
      .leftJoinAndSelect('ur.gym', 'branch')
      .leftJoinAndSelect('branch.parent', 'brand')
      .where("UPPER(ro.name) IN ('ENTRENADOR', 'NUTRICIONISTA')")
      .andWhere('u.isActive = :active', { active: true })
      .orderBy('ro.name', 'ASC')
      .getMany();

    return users.map((user) => {
      const ur = user.userRoles[0];
      return {
        id: user.id,
        fullName: user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
          : 'Asesor Sin Nombre',
        role: ur?.role?.name ?? '-',
        branchName: ur?.gym?.name ?? '-',
        brandName: ur?.gym?.parent?.name ?? '-',
        specialty: user.profile?.experienceLevel ?? 'Profesional',
      };
    });
  }

  async requestAdvisor(clientId: number, advisorId: number): Promise<ClientAdvisor> {
    if (clientId === advisorId) {
      throw new BadRequestException('No puedes solicitarte a ti mismo como asesor.');
    }

    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (!client) throw new UnauthorizedException('Tu sesión expiró. Cierra sesión e inicia de nuevo.');

    const advisor = await this.userRepo.findOne({ where: { id: advisorId } });
    if (!advisor) throw new NotFoundException(`Asesor ${advisorId} no encontrado.`);

    const existing = await this.advisorRepo.findOne({ where: { clientId, advisorId } });

    if (existing && (existing.status === 'PENDING' || existing.status === 'ACTIVE')) {
      throw new ConflictException(
        `Ya tienes una solicitud ${existing.status === 'PENDING' ? 'pendiente' : 'activa'} con este asesor.`,
      );
    }

    // Determine advisor role and enforce 1-per-role limit
    const roleRows = await this.advisorRepo.manager.query<{ role_name: string }[]>(
      `SELECT UPPER(r.name) as role_name FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 LIMIT 1`,
      [advisorId],
    );
    const roleName = roleRows?.[0]?.role_name ?? '';

    const limitRows = await this.advisorRepo.manager.query<{ cnt: string }[]>(
      `SELECT COUNT(*) as cnt FROM client_advisors ca
       JOIN user_roles ur ON ur.user_id = ca.advisor_id
       JOIN roles r ON r.id = ur.role_id
       WHERE ca.client_id = $1 AND UPPER(r.name) = $2 AND ca.status IN ('PENDING', 'ACTIVE')`,
      [clientId, roleName],
    );

    if (parseInt(limitRows?.[0]?.cnt ?? '0') >= 1) {
      const label = roleName === 'ENTRENADOR' ? 'entrenador' : 'nutricionista';
      throw new ConflictException(
        `Ya tienes un ${label} activo o con solicitud pendiente. Cancela la asesoría actual antes de solicitar una nueva.`,
      );
    }

    if (existing) {
      // REJECTED or CANCELLED — allow re-request
      existing.status = 'PENDING';
      return this.advisorRepo.save(existing);
    }

    return this.advisorRepo.save(
      this.advisorRepo.create({ clientId, advisorId, status: 'PENDING' }),
    );
  }

  async cancelAdvisorship(id: number, requesterId: number): Promise<ClientAdvisor> {
    const relation = await this.advisorRepo.findOne({ where: { id } });
    if (!relation) throw new NotFoundException(`Asesoría ${id} no encontrada.`);

    if (relation.clientId !== requesterId && relation.advisorId !== requesterId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta asesoría.');
    }

    if (relation.status !== 'ACTIVE') {
      throw new BadRequestException('Solo se pueden cancelar asesorías activas.');
    }

    relation.status = 'CANCELLED';
    await this.advisorRepo.save(relation);

    // Reset meal plan
    const plan = await this.trainerPlanRepo.findOne({
      where: { trainerId: relation.advisorId, clientId: relation.clientId },
    });
    if (plan) {
      plan.mealPlan = null;
      await this.trainerPlanRepo.save(plan);
    }

    // Deactivate assigned routines
    await this.advisorRepo.manager.query(
      `UPDATE routines SET is_active = false WHERE trainer_id = $1 AND assigned_user_id = $2`,
      [relation.advisorId, relation.clientId],
    );

    return relation;
  }

  async getMyPlan(): Promise<TrainerPlan | null> {
    const userId = this.getAuthUserId();
    const advisor = await this.advisorRepo.findOne({
      where: { clientId: userId, status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });
    if (!advisor) return null;
    return this.trainerPlanRepo.findOne({
      where: { trainerId: advisor.advisorId, clientId: userId },
    });
  }

  async getPendingAdvisorRequests(): Promise<
    { id: number; clientId: number; clientName: string; phone: string | null; createdAt: string }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.advisorRepo
      .createQueryBuilder('ca')
      .select('ca.id', 'id')
      .addSelect('ca.clientId', 'clientId')
      .addSelect('ca.createdAt', 'createdAt')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'clientName',
      )
      .addSelect('client.email', 'clientEmail')
      .addSelect('prof.phone', 'phone')
      .innerJoin('ca.client', 'client')
      .leftJoin('client.profile', 'prof')
      .where('ca.advisorId = :userId', { userId })
      .andWhere("ca.status = 'PENDING'")
      .orderBy('ca.createdAt', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      clientId: Number(r.clientId),
      clientName: (r.clientName as string)?.trim() || (r.clientEmail as string) || '—',
      phone: (r.phone as string) || null,
      createdAt: new Date(r.createdAt as string).toISOString(),
    }));
  }

  async rejectAdvisorship(id: number, advisorUserId: number): Promise<ClientAdvisor> {
    const relation = await this.advisorRepo.findOne({ where: { id } });
    if (!relation) throw new NotFoundException(`Solicitud ${id} no encontrada.`);
    if (relation.advisorId !== advisorUserId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta solicitud.');
    }
    if (relation.status !== 'PENDING') {
      throw new BadRequestException(`La solicitud ya está en estado ${relation.status}.`);
    }
    relation.status = 'REJECTED';
    return this.advisorRepo.save(relation);
  }

  async getActiveAdvisees(): Promise<
    { id: number; clientId: number; clientName: string; phone: string | null }[]
  > {
    const userId = this.getAuthUserId();

    const rows = await this.advisorRepo
      .createQueryBuilder('ca')
      .select('ca.id', 'id')
      .addSelect('ca.clientId', 'clientId')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'clientName',
      )
      .addSelect('client.email', 'clientEmail')
      .addSelect('prof.phone', 'phone')
      .innerJoin('ca.client', 'client')
      .leftJoin('client.profile', 'prof')
      .where('ca.advisorId = :userId', { userId })
      .andWhere("ca.status = 'ACTIVE'")
      .orderBy('ca.createdAt', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      clientId: Number(r.clientId),
      clientName: (r.clientName as string)?.trim() || (r.clientEmail as string) || '—',
      phone: (r.phone as string) || null,
    }));
  }

  async getClientProfile(clientId: number): Promise<{
    clientId: number;
    firstName: string;
    lastName: string;
    phone: string | null;
    ci: string | null;
    gender: string | null;
    heightCm: number | null;
    medicalConditions: string | null;
    latestMetrics: {
      recordedAt: string;
      weightKg: number | null;
      bodyFatPercentage: number | null;
      muscleMassKg: number | null;
      waistCm: number | null;
      chestCm: number | null;
    } | null;
  }> {
    const userId = this.getAuthUserId();

    const relation = await this.advisorRepo.findOne({
      where: { advisorId: userId, clientId, status: 'ACTIVE' },
    });
    if (!relation) {
      throw new ForbiddenException('No tienes una relación activa con este cliente.');
    }

    const [profile, latestMetrics] = await Promise.all([
      this.profileRepo.findOne({ where: { userId: clientId } }),
      this.metricsRepo.findOne({
        where: { userId: clientId },
        order: { recordedAt: 'DESC' },
      }),
    ]);

    return {
      clientId,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? null,
      ci: profile?.ci ?? null,
      gender: profile?.gender ?? null,
      heightCm: profile?.heightCm != null ? Number(profile.heightCm) : null,
      medicalConditions: profile?.medicalConditions ?? null,
      latestMetrics: latestMetrics
        ? {
            recordedAt: latestMetrics.recordedAt.toISOString(),
            weightKg: latestMetrics.weightKg != null ? Number(latestMetrics.weightKg) : null,
            bodyFatPercentage: latestMetrics.bodyFatPercentage != null ? Number(latestMetrics.bodyFatPercentage) : null,
            muscleMassKg: latestMetrics.muscleMassKg != null ? Number(latestMetrics.muscleMassKg) : null,
            waistCm: latestMetrics.waistCm != null ? Number(latestMetrics.waistCm) : null,
            chestCm: latestMetrics.chestCm != null ? Number(latestMetrics.chestCm) : null,
          }
        : null,
    };
  }

  async upsertTrainerPlan(
    clientId: number,
    dto: { dailyKcal?: number; proteinG?: number; carbsG?: number; fatG?: number; planNotes?: string },
  ): Promise<TrainerPlan> {
    const userId = this.getAuthUserId();

    const relation = await this.advisorRepo.findOne({
      where: { advisorId: userId, clientId, status: 'ACTIVE' },
    });
    if (!relation) {
      throw new ForbiddenException('No tienes una relación activa con este cliente.');
    }

    let plan = await this.trainerPlanRepo.findOne({ where: { trainerId: userId, clientId } });
    if (!plan) {
      plan = this.trainerPlanRepo.create({ trainerId: userId, clientId });
    }
    const { mealPlan, ...rest } = dto as any;
    Object.assign(plan, rest);
    if (mealPlan !== undefined) plan.mealPlan = mealPlan;
    return this.trainerPlanRepo.save(plan);
  }

  async getTrainerPlan(clientId: number): Promise<TrainerPlan | null> {
    const userId = this.getAuthUserId();

    const relation = await this.advisorRepo.findOne({
      where: { advisorId: userId, clientId, status: 'ACTIVE' },
    });
    if (!relation) {
      throw new ForbiddenException('No tienes una relación activa con este cliente.');
    }

    return this.trainerPlanRepo.findOne({ where: { trainerId: userId, clientId } });
  }

  async acceptAdvisorship(id: number, advisorUserId: number): Promise<ClientAdvisor> {
    const relation = await this.advisorRepo.findOne({ where: { id } });
    if (!relation) throw new NotFoundException(`Solicitud ${id} no encontrada.`);
    if (relation.advisorId !== advisorUserId) {
      throw new ForbiddenException('Solo el asesor destinatario puede aceptar esta solicitud.');
    }
    if (relation.status !== 'PENDING') {
      throw new BadRequestException(`La solicitud ya está en estado ${relation.status}.`);
    }
    relation.status = 'ACTIVE';
    return this.advisorRepo.save(relation);
  }
}
