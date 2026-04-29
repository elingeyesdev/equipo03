import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class ActivitiesService {
  constructor(
    @InjectRepository(GymActivity) private actRepo: Repository<GymActivity>,
    @InjectRepository(GymActivitySchedule) private schedRepo: Repository<GymActivitySchedule>,
    @InjectRepository(GymActivityAttendance) private attRepo: Repository<GymActivityAttendance>,
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

  async createSchedule(data: Partial<GymActivitySchedule>) {
    if (data.gymActivityId != null) await this.assertActivityInManagerScope(Number(data.gymActivityId));
    return this.schedRepo.save(this.schedRepo.create(data));
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
