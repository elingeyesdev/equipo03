import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation) private repo: Repository<Reservation>,
    @InjectRepository(GymActivitySchedule) private scheduleRepo: Repository<GymActivitySchedule>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private async resolveScheduleGymId(gymActivityScheduleId: number): Promise<number> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: gymActivityScheduleId },
      relations: ['gymActivity'],
    });
    if (!schedule?.gymActivity) throw new NotFoundException(`Horario ${gymActivityScheduleId} no encontrado`);
    return schedule.gymActivity.gymId;
  }

  async create(data: any) {
    const mg = this.managerGymId();
    if (mg !== null && data?.gymActivityScheduleId != null) {
      const gid = await this.resolveScheduleGymId(Number(data.gymActivityScheduleId));
      if (gid !== mg) throw new ForbiddenException('No puede crear reservas en otra sucursal');
    }
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .orderBy('reservation.created_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findByUser(userId: number) {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .where('reservation.user_id = :userId', { userId })
      .orderBy('reservation.reservation_date', 'DESC');

    if (mg !== null) {
      qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const mg = this.managerGymId();

    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
      .leftJoinAndSelect('schedule.gymActivity', 'activity')
      .where('reservation.id = :id', { id });

    if (mg !== null) {
      qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
    }

    const r = await qb.getOne();
    if (r) return r;

    if (mg !== null) {
      const exists = await this.repo.exist({ where: { id } });
      if (exists) throw new ForbiddenException('No tiene permisos para acceder a esta reserva');
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
