import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCatalog } from './domain/exercise-catalog.entity';
import { ExercisesService } from './application/exercises.service';
import { ExercisesController } from './infrastructure/exercises.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseCatalog])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
