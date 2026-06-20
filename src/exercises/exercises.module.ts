import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCatalog } from './domain/exercise-catalog.entity';
import { ExercisesService } from './application/exercises.service';
import { ExercisesController } from './infrastructure/exercises.controller';
import { StorageModule } from '../shared/infrastructure/storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseCatalog]), StorageModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
