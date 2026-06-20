import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Press de Banca Plano' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Ejercicio compuesto principal para pectorales' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Pectorales' })
  @IsString()
  muscleGroup!: string;

  @ApiPropertyOptional({ example: 'FUERZA', enum: ['FUERZA', 'CARDIO', 'FUNCIONAL'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'STRENGTH', enum: ['STRENGTH', 'CARDIO', 'HIIT', 'FUNCTIONAL', 'MOBILITY'] })
  @IsOptional()
  @IsString()
  exerciseType?: string;

  @ApiPropertyOptional({ example: ['Tríceps', 'Deltoides Anterior'] })
  @IsOptional()
  @IsArray()
  secondaryMuscleGroups?: string[];

  @ApiPropertyOptional({ example: 'Barra olímpica, Banco plano' })
  @IsOptional()
  @IsString()
  equipmentRequired?: string;

  @ApiProperty({ example: 'INTERMEDIO' })
  @IsString()
  difficultyLevel!: string;

  @ApiPropertyOptional({ example: 'dQw4w9WgXcQ' })
  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/bench-press.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional({ example: 'Press Inclinado con Mancuernas' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Variación inclinada para pectoral superior' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Pectorales' })
  @IsOptional()
  @IsString()
  muscleGroup?: string;

  @ApiPropertyOptional({ example: 'FUERZA' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'STRENGTH' })
  @IsOptional()
  @IsString()
  exerciseType?: string;

  @ApiPropertyOptional({ example: ['Tríceps'] })
  @IsOptional()
  @IsArray()
  secondaryMuscleGroups?: string[];

  @ApiPropertyOptional({ example: 'Barra olímpica, Banco plano' })
  @IsOptional()
  @IsString()
  equipmentRequired?: string;

  @ApiPropertyOptional({ example: 'AVANZADO' })
  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({ example: 'dQw4w9WgXcQ' })
  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/exercise.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
