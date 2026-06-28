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
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';
import { User } from '../../users/domain/user.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import {
  getManagerGymId,
  type RequestWithUser,
} from '../../common/security/gym-scope';
import {
  aliasesForCanonicalDay,
  CreateActivityScheduleDto,
  DayOfWeek,
} from './dtos/create-activity-schedule.dto';


/** HH:mm o HH:mm:ss → HH:mm para comparar con horarios del gimnasio. */
function toHHmm(time: string): string {
  const s = String(time).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}


@Injectable({ scope: Scope.REQUEST })
export class ActivitiesService {
  constructor(
    @InjectRepository(GymActivity) private actRepo: Repository<GymActivity>,
    @InjectRepository(GymActivitySchedule)
    private schedRepo: Repository<GymActivitySchedule>,
    @InjectRepository(GymActivityAttendance)
    private attRepo: Repository<GymActivityAttendance>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(GymSchedule)
    private gymScheduleRepo: Repository<GymSchedule>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  async createActivity(data: Partial<GymActivity>) {
    const mg = this.managerGymId();
    const merged: Partial<GymActivity> = { ...data };
    if (mg !== null) merged.gymId = mg;
    return this.actRepo.save(this.actRepo.create(merged));
  }

  async updateActivity(id: number, data: Partial<GymActivity>) {
    const activity = await this.assertActivityInManagerScope(id);

    // GERENTE no puede reasignar la actividad a una sede ajena
    if (data.gymId !== undefined) {
      const mg = this.managerGymId();
      if (mg !== null && Number(data.gymId) !== mg) {
        throw new ForbiddenException(
          'No puede reasignar la actividad a una sede que no es la suya.',
        );
      }
    }

    Object.assign(activity, data);
    return this.actRepo.save(activity);
  }

  async deleteActivity(id: number) {
    await this.assertActivityInManagerScope(id);
    return this.dataSource.transaction(async (em) => {
      // DELETE físico dispara ON DELETE CASCADE en gym_activity_attendance vía FK de BD
      await em.delete(GymActivitySchedule, { gymActivityId: id });
      await em.update(GymActivity, id, { isActive: false });
      return { message: 'Servicio y sus horarios asociados eliminados correctamente.' };
    });
  }

  async getEligibleInstructors(): Promise<{ id: number; fullName: string }[]> {
    const currentUser = this.request.user;
    if (!currentUser?.userId) throw new ForbiddenException('No autenticado.');

    const callerRoles = await this.userRoleRepo.find({
      where: { userId: Number(currentUser.userId) },
      relations: ['role', 'gym'],
    });
    const topRole = callerRoles.sort(
      (a, b) => (b.role?.hierarchyLevel ?? 0) - (a.role?.hierarchyLevel ?? 0),
    )[0];
    const callerLevel = Number(topRole?.role?.hierarchyLevel ?? currentUser.level ?? 0);
    const callerGymId = Number(topRole?.gym?.id ?? topRole?.gymId ?? 0);

    if (callerLevel < 4) {
      throw new ForbiddenException('Sin permisos administrativos para ver instructores.');
    }

    // Consulta correlacionada: hierarchy_level = 2 Y territorio en el mismo camino de join
    const qb = this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.profile', 'profile')
      .innerJoin('user.userRoles', 'ur')
      .innerJoin('ur.role', 'r', 'r.hierarchy_level = 2')
      .innerJoin('ur.gym', 'g')
      .where('user.isActive = true');

    if (callerLevel >= 10) {
      // Super Admin: acceso global, sin filtro territorial
    } else if (callerLevel === 5) {
      if (!callerGymId) throw new ForbiddenException('Gerente sin marca asignada.');
      qb.andWhere('(g.id = :callerGymId OR g.parentId = :callerGymId)', { callerGymId });
    } else {
      if (!callerGymId) throw new ForbiddenException('Recepcionista sin sucursal asignada.');
      qb.andWhere('g.id = :callerGymId', { callerGymId });
    }

    const users = await qb.getMany();

    const seen = new Set<number>();
    return users
      .filter((u) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      })
      .map((u) => ({
        id: u.id,
        fullName: `${u.profile?.firstName ?? ''} ${u.profile?.lastName ?? ''}`.trim(),
      }));
  }

  async findAllActivities(gymId?: number) {
    const currentUser = this.request.user;

    // ── 1. Resolución de identidad vía BD ─────────────────────────────────────
    let callerLevel = 0;
    let callerGymId = 0;

    if (currentUser?.userId) {
      const callerDbRole = await this.userRoleRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.role', 'role')
        .leftJoinAndSelect('ur.gym', 'gym')
        .where('ur.user_id = :userId', { userId: Number(currentUser.userId) })
        .orderBy('role.hierarchyLevel', 'DESC')
        .getOne();

      callerLevel = Number(callerDbRole?.role?.hierarchyLevel ?? 0);
      callerGymId = Number(callerDbRole?.gymId ?? 0);
    }

    // ── 2. QueryBuilder base con JOIN a gym activo para el filtro GERENTE ─────
    const query = this.actRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.gym', 'gym')
      .leftJoinAndSelect('activity.schedules', 'sched')
      .leftJoinAndSelect('sched.instructor', 'schedInstructor')
      .leftJoinAndSelect('schedInstructor.profile', 'schedInstructorProfile')
      .where('activity.isActive = :active', { active: true });

    // ── 3. Filtro de alcance territorial ──────────────────────────────────────
    if (callerLevel >= 10) {
      // SUPER ADMIN: catálogo completo; respeta filtro opcional por gymId
      if (gymId !== undefined) {
        query.andWhere('activity.gymId = :gymId', { gymId });
      }
    } else if (callerLevel === 5) {
      // GERENTE: actividades de su Marca (padre) + todas sus sucursales hijas
      if (!callerGymId) throw new ForbiddenException('Gerente sin marca asignada.');
      query.andWhere(
        '(activity.gymId = :callerGymId OR gym.parentId = :callerGymId)',
        { callerGymId },
      );
    } else if (callerLevel === 4) {
      // RECEPCIONISTA: estrictamente su propia sucursal
      if (!callerGymId) throw new ForbiddenException('Recepcionista sin sucursal asignada.');
      query.andWhere('activity.gymId = :callerGymId', { callerGymId });
    } else {
      // Público / clientes: actividades de la sucursal pedida + su marca padre
      if (gymId !== undefined) {
        query.andWhere(
          `(activity.gymId = :gymId OR activity.gymId IN (
            SELECT g.parent_id FROM gyms g
            WHERE g.id = :gymId AND g.parent_id IS NOT NULL
          ))`,
          { gymId },
        );
      }
    }

    return query.getMany();
  }

  async findOneActivity(id: number) {
    const mg = this.managerGymId();
    const a = await this.actRepo.findOne({
      where: { id },
      relations: ['gym', 'schedules', 'schedules.instructor'],
    });
    if (!a) throw new NotFoundException(`Actividad ${id} no encontrada`);
    if (mg !== null && Number(a.gymId) !== mg) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a esta actividad',
      );
    }
    return a;
  }

  private async assertActivityInManagerScope(
    gymActivityId: number,
  ): Promise<GymActivity> {
    const mg = this.managerGymId();
    const a = await this.actRepo.findOne({ where: { id: gymActivityId } });
    if (!a)
      throw new NotFoundException(`Actividad ${gymActivityId} no encontrada`);
    if (mg !== null && Number(a.gymId) !== mg) {
      throw new ForbiddenException(
        'No tiene permisos para gestionar esta actividad',
      );
    }
    return a;
  }

  private async assertScheduleInManagerScope(
    scheduleId: number,
  ): Promise<GymActivitySchedule> {
    const mg = this.managerGymId();
    const s = await this.schedRepo.findOne({
      where: { id: scheduleId },
      relations: ['gymActivity'],
    });
    if (!s?.gymActivity)
      throw new NotFoundException(`Horario ${scheduleId} no encontrado`);
    if (mg !== null && Number(s.gymActivity.gymId) !== mg) {
      throw new ForbiddenException(
        'No tiene permisos para gestionar este horario',
      );
    }
    return s;
  }

  async createSchedule(
    activityId: number,
    dto: CreateActivityScheduleDto,
  ): Promise<GymActivitySchedule> {
    const activity = await this.assertActivityInManagerScope(activityId);
    if (!activity.isActive) {
      throw new BadRequestException('La actividad no está activa');
    }

    await this.assertInstructorEligible(dto.instructorId);

    const dayVariants = aliasesForCanonicalDay(dto.dayOfWeek);
    const overlapCount = await this.schedRepo
      .createQueryBuilder('sched')
      .where('sched.instructor_id = :iid', { iid: dto.instructorId })
      .andWhere('sched.day_of_week IN (:...days)', { days: dayVariants })
      .andWhere('sched.start_time < CAST(:newEnd AS time)', {
        newEnd: dto.endTime,
      })
      .andWhere('sched.end_time > CAST(:newStart AS time)', {
        newStart: dto.startTime,
      })
      .getCount();

    if (overlapCount > 0) {
      throw new ConflictException(
        'El instructor ya tiene una clase en este horario',
      );
    }

    await this.assertWithinGymOpeningHours(
      activity.gymId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

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
      throw new NotFoundException(
        `Usuario instructor ${instructorId} no encontrado`,
      );
    }
    if (!user.isActive) {
      throw new ForbiddenException('El instructor indicado no está activo');
    }
    const ok = user.userRoles?.some((ur) => {
      const lvl = ur.role?.hierarchyLevel ?? 0;
      return lvl === 2;
    });
    if (!ok) {
      throw new ForbiddenException(
        'El usuario indicado no tiene rol de instructor (nivel 2)',
      );
    }
  }

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
    const sameDay = slots.filter((s) =>
      dayVariants.includes(String(s.dayOfWeek).toUpperCase()),
    );
    if (sameDay.length === 0) {
      return;
    }

    const start = toHHmm(startTime);
    const end = toHHmm(endTime);
    const covered = sameDay.some((row) => {
      const open = toHHmm(row.opensAt);
      const close = toHHmm(row.closesAt);
      return open <= start && close >= end;
    });

    if (!covered) {
      throw new ConflictException(
        'El horario de la clase queda fuera del horario de apertura configurado para la sede',
      );
    }
  }

  async findSchedulesByActivity(gymActivityId: number) {
    // No aplicamos scope de gerente aquí: cualquier usuario autenticado
    // puede consultar los horarios de una actividad (la pantalla de reserva los necesita).
    return this.schedRepo.find({
      where: { gymActivityId },
      relations: ['instructor', 'instructor.profile'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async getInstructorSchedules(
    instructorId: number,
  ): Promise<{ day: string; time: string; activity: string; gymName: string }[]> {
    const schedules = await this.schedRepo.find({
      where: { instructorId },
      relations: ['gymActivity', 'gymActivity.gym'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    return schedules.map((s) => ({
      day: s.dayOfWeek,
      time: `${toHHmm(s.startTime)} - ${toHHmm(s.endTime)}`,
      activity: s.gymActivity?.name ?? '—',
      gymName: s.gymActivity?.gym?.name ?? '—',
    }));
  }

  async deleteSchedule(scheduleId: number): Promise<{ message: string }> {
    await this.assertScheduleInManagerScope(scheduleId);
    await this.schedRepo.delete(scheduleId);
    return { message: `Horario ${scheduleId} eliminado` };
  }

  async registerAttendance(data: Partial<GymActivityAttendance>) {
    if (data.gymActivityScheduleId != null) {
      await this.assertScheduleInManagerScope(
        Number(data.gymActivityScheduleId),
      );
    }
    return this.attRepo.save(this.attRepo.create(data));
  }

  async findAttendances(gymActivityScheduleId: number) {
    await this.assertScheduleInManagerScope(gymActivityScheduleId);
    return this.attRepo.find({
      where: { gymActivityScheduleId },
      relations: ['user'],
    });
  }
}
