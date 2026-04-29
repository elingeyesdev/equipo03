import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private getManagerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private ensureManagerCanAccessGym(gymId: number): void {
    const managerGymId = this.getManagerGymId();
    if (managerGymId !== null && managerGymId !== gymId) {
      throw new ForbiddenException('No tiene permisos para acceder a otra sucursal');
    }
  }

  create(data: Partial<CheckIn>) { return this.repo.save(this.repo.create(data)); }

  findAll() {
    const managerGymId = this.getManagerGymId();
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .orderBy('checkIn.check_in_time', 'DESC');

    if (managerGymId !== null) {
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    }

    return qb.getMany();
  }

  findByUser(userId: number) {
    const managerGymId = this.getManagerGymId();
    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.user_id = :userId', { userId })
      .orderBy('checkIn.check_in_time', 'DESC');

    if (managerGymId !== null) {
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    }

    return qb.getMany();
  }

  findByGym(gymId: number) {
    this.ensureManagerCanAccessGym(gymId);
    return this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .where('checkIn.gym_id = :gymId', { gymId })
      .orderBy('checkIn.check_in_time', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    const managerGymId = this.getManagerGymId();

    const qb = this.repo
      .createQueryBuilder('checkIn')
      .leftJoinAndSelect('checkIn.user', 'user')
      .leftJoinAndSelect('checkIn.gym', 'gym')
      .where('checkIn.id = :id', { id });

    if (managerGymId !== null) {
      qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
    }

    const c = await qb.getOne();
    if (c) return c;

    if (managerGymId !== null) {
      const exists = await this.repo.exist({ where: { id } });
      if (exists) {
        throw new ForbiddenException('No tiene permisos para acceder a este check-in');
      }
    }

    throw new NotFoundException(`Check-in ${id} no encontrado`);
  }

  async checkOut(id: number) { const c = await this.findOne(id); c.checkOutTime = new Date(); return this.repo.save(c); }
}
