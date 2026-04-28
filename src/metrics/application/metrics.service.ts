import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhysicalMetricsHistory } from '../domain/physical-metrics-history.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class MetricsService {
  constructor(
    @InjectRepository(PhysicalMetricsHistory) private repo: Repository<PhysicalMetricsHistory>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  create(data: Partial<PhysicalMetricsHistory>) {
    const mg = this.managerGymId();
    const merged = { ...data };
    if (mg !== null && merged.gymId !== undefined && merged.gymId !== null && Number(merged.gymId) !== mg) {
      throw new ForbiddenException('No puede registrar métricas para otra sucursal');
    }
    if (mg !== null && (merged.gymId === undefined || merged.gymId === null)) {
      merged.gymId = mg;
    }
    return this.repo.save(this.repo.create(merged));
  }

  findAll() {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder('pmh')
      .leftJoinAndSelect('pmh.user', 'user')
      .leftJoinAndSelect('pmh.gym', 'gym')
      .orderBy('pmh.recorded_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findByUser(userId: number) {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder('pmh')
      .where('pmh.user_id = :userId', { userId })
      .orderBy('pmh.recorded_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  async findLatest(userId: number) {
    const mg = this.managerGymId();
    const qb = this.repo
      .createQueryBuilder('pmh')
      .where('pmh.user_id = :userId', { userId })
      .orderBy('pmh.recorded_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
    }

    const m = await qb.getOne();
    if (!m) throw new NotFoundException(`No hay métricas para usuario ${userId}`);
    return m;
  }

  async findOne(id: number) {
    const mg = this.managerGymId();

    const qb = this.repo
      .createQueryBuilder('pmh')
      .leftJoinAndSelect('pmh.user', 'user')
      .leftJoinAndSelect('pmh.gym', 'gym')
      .where('pmh.id = :id', { id });

    if (mg !== null) {
      qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
    }

    const m = await qb.getOne();
    if (m) return m;

    if (mg !== null) {
      const exists = await this.repo.exist({ where: { id } });
      if (exists) throw new ForbiddenException('No tiene permisos para acceder a esta medición');
    }

    throw new NotFoundException(`Métrica ${id} no encontrada`);
  }

  async remove(id: number) {
    await this.findOne(id);
    const r = await this.repo.delete(id);
    if (r.affected === 0) throw new NotFoundException(`Métrica ${id} no encontrada`);
  }
}
