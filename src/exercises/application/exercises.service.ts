import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseCatalog } from '../domain/exercise-catalog.entity';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(ExerciseCatalog)
    private repo: Repository<ExerciseCatalog>,
    private readonly storageService: StorageService,
  ) {}

  create(data: Partial<ExerciseCatalog>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll(filters?: {
    muscleGroup?: string;
    difficultyLevel?: string;
    category?: string;
    exerciseType?: string;
  }) {
    const qb = this.repo.createQueryBuilder('e');
    if (filters?.muscleGroup)
      qb.andWhere('e.muscle_group ILIKE :mg', { mg: `%${filters.muscleGroup}%` });
    if (filters?.difficultyLevel)
      qb.andWhere('e.difficulty_level = :dl', { dl: filters.difficultyLevel });
    if (filters?.category)
      qb.andWhere('e.category = :cat', { cat: filters.category });
    if (filters?.exerciseType)
      qb.andWhere('e.exercise_type = :et', { et: filters.exerciseType });
    return qb.andWhere('e.is_active = true').orderBy('e.name', 'ASC').getMany();
  }

  async findOne(id: number) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`Ejercicio ${id} no encontrado`);
    return e;
  }

  async update(id: number, data: Partial<ExerciseCatalog>) {
    const e = await this.findOne(id);
    Object.assign(e, data);
    return this.repo.save(e);
  }

  async updateExerciseImage(id: number, fileBuffer: Buffer) {
    const exercise = await this.findOne(id);
    if (exercise.imageUrl) {
      await this.storageService.deleteImage(exercise.imageUrl).catch(() => {});
    }
    const imageUrl = await this.storageService.uploadImage(fileBuffer, 'gym_equipment');
    exercise.imageUrl = imageUrl;
    return this.repo.save(exercise);
  }

  async deleteExerciseImage(id: number) {
    const exercise = await this.findOne(id);
    if (exercise.imageUrl) {
      await this.storageService.deleteImage(exercise.imageUrl);
      exercise.imageUrl = null as any;
      return this.repo.save(exercise);
    }
    return exercise;
  }

  async remove(id: number) {
    const exercise = await this.findOne(id);
    if (exercise.imageUrl) {
      await this.storageService.deleteImage(exercise.imageUrl);
    }
    const r = await this.repo.delete(id);
    if (r.affected === 0)
      throw new NotFoundException(`Ejercicio ${id} no encontrado`);
  }
}
