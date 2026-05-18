import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';
import { User } from '../../users/domain/user.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';
import {
  aliasesForCanonicalDay,
  CreateActivityScheduleDto,
  DayOfWeek,
} from './dtos/create-activity-schedule.dto';

const INSTRUCTOR_ROLE_NAMES = new Set(['ENTRENADOR', 'TRAINER', 'INSTRUCTOR']);

/** HH:mm o HH:mm:ss → HH:mm para comparar con horarios del gimnasio. */
function toHHmm(time: string): string {
  const s = String(time).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

@Injectable({ scope: Scope.REQUEST })
export class ActivitiesService {
  constructor(
    @InjectRepository(GymActivity) private actRepo: Repository<GymActivity>,
    @InjectRepository(GymActivitySchedule) private schedRepo: Repository<GymActivitySchedule>,
    @InjectRepository(GymActivityAttendance) private attRepo: Repository<GymActivityAttendance>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(GymSchedule) private gymScheduleRepo: Repository<GymSchedule>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private resolveListGymFilter(managerGymId: number | null, requestedGymId?: number): number | undefined | null {
    if (managerGymId === null) return requestedGymId ?? undefined;
    if (requestedGymId !== undefined && requestedGymId !== null && Number(requestedGymId) !== managerGymId) {
      throw new ForbiddenException('No tiene permisos para consultar otra sucursal');
    }
    return managerGymId;
  }

  async createActivity(data: Partial<GymActivity>) {
    const mg = this.managerGymId();
    const merged: Partial<GymActivity> = { ...data };
    if (mg !== null) merged.gymId = mg;
    return this.actRepo.save(this.actRepo.create(merged));
  }

  findAllActivities(gymId?: number) {
    const mg = this.managerGymId();
    const effective = this.resolveListGymFilter(mg, gymId === undefined ? undefined : Number(gymId));

    const qb = this.actRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.gym', 'gym')
      .leftJoinAndSelect('activity.schedules', 'schedules')
      .where('activity.is_active = :active', { active: true });

    if (effective !== undefined && effective !== null) {
      qb.andWhere('activity.gym_id = :gymId', { gymId: effective });
    }

    return qb.getMany();
  }

  async findOneActivity(id: number) {
    const mg = this.managerGymId();
    const a = await this.actRepo.findOne({
      where: { id },
      relations: ['gym', 'schedules', 'schedules.instructor'],
    });
    if (!a) throw new NotFoundException(`Actividad ${id} no encontrada`);
    if (mg !== null && Number(a.gymId) !== mg) {
      throw new ForbiddenException('No tiene permisos para acceder a esta actividad');
    }
    return a;
  }

  private async assertActivityInManagerScope(gymActivityId: number): Promise<GymActivity> {
    const mg = this.managerGymId();
    const a = await this.actRepo.findOne({ where: { id: gymActivityId } });
    if (!a) throw new NotFoundException(`Actividad ${gymActivityId} no encontrada`);
    if (mg !== null && Number(a.gymId) !== mg) {
      throw new ForbiddenException('No tiene permisos para gestionar esta actividad');
    }
    return a;
  }

  private async assertScheduleInManagerScope(scheduleId: number): Promise<GymActivitySchedule> {
    const mg = this.managerGymId();
    const s = await this.schedRepo.findOne({
      where: { id: scheduleId },
      relations: ['gymActivity'],
    });
    if (!s?.gymActivity) throw new NotFoundException(`Horario ${scheduleId} no encontrado`);
    if (mg !== null && Number(s.gymActivity.gymId) !== mg) {
      throw new ForbiddenException('No tiene permisos para gestionar este horario');
    }
    return s;
  }

  /**
   * Crea un horario para una actividad: valida instructor con rol permitido,
   * solapamiento de instructor en mismo día/hora y (si hay filas) horario del gimnasio.
   */
  async createSchedule(activityId: number, dto: CreateActivityScheduleDto): Promise<GymActivitySchedule> {
    const activity = await this.assertActivityInManagerScope(activityId);
    if (!activity.isActive) {
      throw new BadRequestException('La actividad no está activa');
    }

    await this.assertInstructorEligible(dto.instructorId);

    const dayVariants = aliasesForCanonicalDay(dto.dayOfWeek as DayOfWeek);
    const overlapCount = await this.schedRepo
      .createQueryBuilder('sched')
      .where('sched.instructor_id = :iid', { iid: dto.instructorId })
      .andWhere('sched.day_of_week IN (:...days)', { days: dayVariants })
      .andWhere('sched.start_time < CAST(:newEnd AS time)', { newEnd: dto.endTime })
      .andWhere('sched.end_time > CAST(:newStart AS time)', { newStart: dto.startTime })
      .getCount();

    if (overlapCount > 0) {
      throw new ConflictException('El instructor ya tiene una clase en este horario');
    }

    await this.assertWithinGymOpeningHours(activity.gymId, dto.dayOfWeek, dto.startTime, dto.endTime);

    const entity = this.schedRepo.create({
      gymActivityId: activityId,
      instructorId: dto.instructorId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      maxAttendees: dto.maxAttendees,
      isRecurring: dto.isRecurring ?? true,
    });
    return this.schedRepo.save(entity);
  }

  private async assertInstructorEligible(instructorId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: instructorId },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario instructor ${instructorId} no encontrado`);
    }
    if (!user.isActive) {
      throw new ForbiddenException('El instructor indicado no está activo');
    }
    const ok = user.userRoles?.some((ur) =>
      INSTRUCTOR_ROLE_NAMES.has(String(ur.role?.name ?? '').toUpperCase()),
    );
    if (!ok) {
      throw new ForbiddenException('El usuario indicado no tiene rol de instructor');
    }
  }

  /** Si la sede tiene filas en `gym_schedules`, la clase debe caer dentro de al menos una ventana no festiva. */
  private async assertWithinGymOpeningHours(
    gymId: number,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const dayVariants = aliasesForCanonicalDay(dayOfWeek);
    const slots = await this.gymScheduleRepo.find({
      where: {
        gymId,
        isHoliday: false,
      },
    });
    const sameDay = slots.filter((s) => dayVariants.includes(String(s.dayOfWeek).toUpperCase()));
    if (sameDay.length === 0) {
      return;
    }

    const start = toHHmm(startTime);
    const end = toHHmm(endTime);
    const covered = sameDay.some((row) => {
      const open = toHHmm(row.opensAt as unknown as string);
      const close = toHHmm(row.closesAt as unknown as string);
      return open <= start && close >= end;
    });

    if (!covered) {
      throw new ConflictException(
        'El horario de la clase queda fuera del horario de apertura configurado para la sede',
      );
    }
  }

  async findSchedulesByActivity(gymActivityId: number) {
    await this.assertActivityInManagerScope(gymActivityId);
    return this.schedRepo.find({ where: { gymActivityId }, relations: ['instructor'] });
  }

  async registerAttendance(data: Partial<GymActivityAttendance>) {
    if (data.gymActivityScheduleId != null) {
      await this.assertScheduleInManagerScope(Number(data.gymActivityScheduleId));
    }
    return this.attRepo.save(this.attRepo.create(data));
  }

  async findAttendances(gymActivityScheduleId: number) {
    await this.assertScheduleInManagerScope(gymActivityScheduleId);
    return this.attRepo.find({ where: { gymActivityScheduleId }, relations: ['user'] });
  }
}
