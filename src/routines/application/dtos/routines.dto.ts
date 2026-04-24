import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RoutineExerciseItemDto {
  @ApiProperty({ example: 1, description: 'ID del ejercicio del catálogo' })
  @IsInt()
  exerciseId: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  orderPosition: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  setsRecommended: number;

  @ApiProperty({ example: '8-12' })
  @IsString()
  repsRecommended: string;

  @ApiPropertyOptional({ example: 60.0 })
  @IsOptional() @IsNumber()
  weightRecommendedKg?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @IsInt()
  restSecondsBetweenSets?: number;

  @ApiPropertyOptional({ example: 'Controlar el negativo' })
  @IsOptional() @IsString()
  notes?: string;
}

export class CreateRoutineDto {
  @ApiProperty({ example: 'Rutina Push - Día A' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Pecho, hombros y tríceps' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID del entrenador' })
  @IsInt()
  trainerId: number;

  @ApiPropertyOptional({ example: 2, description: 'ID del usuario asignado' })
  @IsOptional() @IsInt()
  assignedUserId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del gimnasio' })
  @IsOptional() @IsInt()
  gymId?: number;

  @ApiProperty({ example: 'INTERMEDIO' })
  @IsString()
  difficultyLevel: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional() @IsInt()
  durationWeeks?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isTemplate?: boolean;

  @ApiPropertyOptional({
    type: [RoutineExerciseItemDto],
    example: [
      { exerciseId: 1, orderPosition: 0, setsRecommended: 4, repsRecommended: '8-12', weightRecommendedKg: 60, restSecondsBetweenSets: 90 },
      { exerciseId: 2, orderPosition: 1, setsRecommended: 3, repsRecommended: '10-15', weightRecommendedKg: 40, restSecondsBetweenSets: 60 },
    ],
  })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RoutineExerciseItemDto)
  exercises?: RoutineExerciseItemDto[];
}

export class UpdateRoutineDto {
  @ApiPropertyOptional({ example: 'Rutina Pull - Día B' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Espalda y bíceps' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'AVANZADO' })
  @IsOptional() @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [RoutineExerciseItemDto],
    example: [
      { exerciseId: 3, orderPosition: 0, setsRecommended: 3, repsRecommended: '12', weightRecommendedKg: 50, restSecondsBetweenSets: 75 },
    ],
  })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RoutineExerciseItemDto)
  exercises?: RoutineExerciseItemDto[];
}
