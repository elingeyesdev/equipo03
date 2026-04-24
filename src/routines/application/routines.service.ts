import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Routine } from '../domain/routine.entity';
import { RoutineExercise } from '../domain/routine-exercise.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine) private routinesRepo: Repository<Routine>,
    @InjectRepository(RoutineExercise) private reRepo: Repository<RoutineExercise>,
  ) {}

  async create(data: any) {
    const { exercises, ...routineData } = data;
    const routineEntity: DeepPartial<Routine> = routineData;
    const routine = await this.routinesRepo.save(this.routinesRepo.create(routineEntity));
    if (exercises?.length) {
      const items = exercises.map((e: any, i: number) => this.reRepo.create({ ...e, routineId: routine.id, orderPosition: e.orderPosition ?? i } as DeepPartial<RoutineExercise>));
      await this.reRepo.save(items);
    }
    return this.findOne(routine.id);
  }

  findAll() { return this.routinesRepo.find({ where: { isActive: true }, relations: ['trainer', 'assignedUser', 'gym', 'exercises', 'exercises.exercise'] }); }
  findByUser(userId: number) { return this.routinesRepo.find({ where: { assignedUserId: userId, isActive: true }, relations: ['exercises', 'exercises.exercise'] }); }
  findByTrainer(trainerId: number) { return this.routinesRepo.find({ where: { trainerId, isActive: true }, relations: ['assignedUser', 'exercises'] }); }

  async findOne(id: number) {
    const r = await this.routinesRepo.findOne({ where: { id }, relations: ['trainer', 'assignedUser', 'gym', 'exercises', 'exercises.exercise'] });
    if (!r) throw new NotFoundException(`Rutina ${id} no encontrada`);
    return r;
  }

  async update(id: number, data: any) {
    const r = await this.findOne(id);
    const { exercises, ...rData } = data;
    Object.assign(r, rData);
    await this.routinesRepo.save(r);
    if (exercises) { await this.reRepo.delete({ routineId: id }); const items = exercises.map((e: any, i: number) => this.reRepo.create({ ...e, routineId: id, orderPosition: e.orderPosition ?? i })); await this.reRepo.save(items); }
    return this.findOne(id);
  }

  async remove(id: number) { const r = await this.routinesRepo.delete(id); if (r.affected === 0) throw new NotFoundException(`Rutina ${id} no encontrada`); }
}
