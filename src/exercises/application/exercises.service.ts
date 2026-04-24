import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseCatalog } from '../domain/exercise-catalog.entity';

@Injectable()
export class ExercisesService {
  constructor(@InjectRepository(ExerciseCatalog) private repo: Repository<ExerciseCatalog>) {}

  create(data: Partial<ExerciseCatalog>) { return this.repo.save(this.repo.create(data)); }

  findAll(filters?: { muscleGroup?: string; difficultyLevel?: string }) {
    const qb = this.repo.createQueryBuilder('e');
    if (filters?.muscleGroup) qb.andWhere('e.muscle_group ILIKE :mg', { mg: `%${filters.muscleGroup}%` });
    if (filters?.difficultyLevel) qb.andWhere('e.difficulty_level = :dl', { dl: filters.difficultyLevel });
    return qb.andWhere('e.is_active = true').orderBy('e.name', 'ASC').getMany();
  }

  async findOne(id: number) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`Ejercicio ${id} no encontrado`);
    return e;
  }

  async update(id: number, data: Partial<ExerciseCatalog>) {
    const e = await this.findOne(id); Object.assign(e, data); return this.repo.save(e);
  }

  async remove(id: number) {
    const r = await this.repo.delete(id);
    if (r.affected === 0) throw new NotFoundException(`Ejercicio ${id} no encontrado`);
  }
}
