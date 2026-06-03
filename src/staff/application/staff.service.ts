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
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { NutritionalAppointment } from '../domain/nutritional-appointment.entity';
import { Reservation } from '../../reservations/domain/reservation.entity';
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
  constructor(
    @InjectRepository(GymActivitySchedule)
    private scheduleRepo: Repository<GymActivitySchedule>,
    @InjectRepository(NutritionalAppointment)
    private appointmentRepo: Repository<NutritionalAppointment>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

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
