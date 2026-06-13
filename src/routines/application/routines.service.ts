import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Routine } from '../domain/routine.entity';
import { RoutineExercise } from '../domain/routine-exercise.entity';
import {
  getManagerGymId,
  type RequestWithUser,
} from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class RoutinesService {
  constructor(
    @InjectRepository(Routine) private routinesRepo: Repository<Routine>,
    @InjectRepository(RoutineExercise)
    private reRepo: Repository<RoutineExercise>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  async create(data: any) {
    const mg = this.managerGymId();
    const { exercises, ...routineData } = data;
    const routineEntity: DeepPartial<Routine> = { ...routineData };

    if (mg !== null) {
      if (
        routineEntity.gymId !== undefined &&
        routineEntity.gymId !== null &&
        Number(routineEntity.gymId) !== mg
      ) {
        throw new ForbiddenException(
          'No puede crear rutinas para otra sucursal',
        );
      }
      routineEntity.gymId = mg;
    }

    const routine = await this.routinesRepo.save(
      this.routinesRepo.create(routineEntity),
    );
    if (exercises?.length) {
      const items = exercises.map((e: any, i: number) =>
        this.reRepo.create({
          ...e,
          routineId: routine.id,
          orderPosition: e.orderPosition ?? i,
        } as DeepPartial<RoutineExercise>),
      );
      await this.reRepo.save(items);
    }
    return this.findOne(routine.id);
  }

  findAll(isTemplate?: boolean) {
    const mg = this.managerGymId();
    const qb = this.routinesRepo
      .createQueryBuilder('routine')
      .leftJoinAndSelect('routine.trainer', 'trainer')
      .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
      .leftJoinAndSelect('routine.gym', 'gym')
      .leftJoinAndSelect('routine.exercises', 'exercises')
      .leftJoinAndSelect('exercises.exercise', 'exercise')
      .where('routine.is_active = :isActive', { isActive: true });

    if (isTemplate !== undefined) {
      qb.andWhere('routine.is_template = :isTemplate', { isTemplate });
    }

    // Templates are global — skip gym scope so all gyms can see them
    if (mg !== null && isTemplate !== true) {
      qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findByUser(userId: number) {
    const mg = this.managerGymId();
    const qb = this.routinesRepo
      .createQueryBuilder('routine')
      .leftJoinAndSelect('routine.exercises', 'exercises')
      .leftJoinAndSelect('exercises.exercise', 'exercise')
      .where('routine.assigned_user_id = :userId', { userId })
      .andWhere('routine.is_active = :isActive', { isActive: true });

    if (mg !== null) {
      qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findByTrainer(trainerId: number) {
    const mg = this.managerGymId();
    const qb = this.routinesRepo
      .createQueryBuilder('routine')
      .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
      .leftJoinAndSelect('routine.exercises', 'exercises')
      .where('routine.trainer_id = :trainerId', { trainerId })
      .andWhere('routine.is_active = :isActive', { isActive: true });

    if (mg !== null) {
      qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  async getMyStudents(trainerId: number) {
    const routines = await this.routinesRepo
      .createQueryBuilder('routine')
      .innerJoinAndSelect('routine.assignedUser', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('routine.trainer_id = :trainerId', { trainerId })
      .andWhere('routine.assigned_user_id IS NOT NULL')
      .andWhere('routine.is_active = :isActive', { isActive: true })
      .getMany();

    const seen = new Set<number>();
    return routines
      .filter((r) => {
        if (!r.assignedUserId || seen.has(r.assignedUserId)) return false;
        seen.add(r.assignedUserId);
        return true;
      })
      .map((r) => ({
        id: r.assignedUser.id,
        email: r.assignedUser.email,
        isActive: r.assignedUser.isActive,
        profile: r.assignedUser.profile ?? null,
      }));
  }

  async findOne(id: number) {
    const mg = this.managerGymId();
    const qb = this.routinesRepo
      .createQueryBuilder('routine')
      .leftJoinAndSelect('routine.trainer', 'trainer')
      .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
      .leftJoinAndSelect('routine.gym', 'gym')
      .leftJoinAndSelect('routine.exercises', 'exercises')
      .leftJoinAndSelect('exercises.exercise', 'exercise')
      .where('routine.id = :id', { id });

    if (mg !== null) {
      // Allow access to global templates (is_template=true) regardless of gym
      qb.andWhere(
        '(routine.gym_id = :gymId OR routine.is_template = true)',
        { gymId: mg },
      );
    }

    const r = await qb.getOne();
    if (r) return r;

    if (mg !== null) {
      const exists = await this.routinesRepo.exist({ where: { id } });
      if (exists)
        throw new ForbiddenException(
          'No tiene permisos para acceder a esta rutina',
        );
    }

    throw new NotFoundException(`Rutina ${id} no encontrada`);
  }

  async update(id: number, data: any) {
    const r = await this.findOne(id);
    const mg = this.managerGymId();

    const { exercises, ...rData } = data;
    if (
      mg !== null &&
      rData.gymId !== undefined &&
      rData.gymId !== null &&
      Number(rData.gymId) !== mg
    ) {
      throw new ForbiddenException('No puede mover la rutina a otra sucursal');
    }

    Object.assign(r, rData);
    await this.routinesRepo.save(r);

    if (exercises) {
      await this.reRepo.delete({ routineId: id });
      const items = exercises.map((e: any, i: number) =>
        this.reRepo.create({
          ...e,
          routineId: id,
          orderPosition: e.orderPosition ?? i,
        }),
      );
      await this.reRepo.save(items);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    const r = await this.routinesRepo.delete(id);
    if (r.affected === 0)
      throw new NotFoundException(`Rutina ${id} no encontrada`);
  }
}
