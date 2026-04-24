import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Routine } from './domain/routine.entity';
import { RoutineExercise } from './domain/routine-exercise.entity';
import { RoutinesService } from './application/routines.service';
import { RoutinesController } from './infrastructure/routines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Routine, RoutineExercise])],
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
