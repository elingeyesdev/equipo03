import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Press de Banca' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Ejercicio compuesto principal para pectorales' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'Pecho' })
  @IsString()
  muscleGroup: string;

  @ApiPropertyOptional({ example: ['Tríceps', 'Deltoides Anterior'] })
  @IsOptional() @IsArray()
  secondaryMuscleGroups?: string[];

  @ApiPropertyOptional({ example: 'Barra olímpica, Banco plano' })
  @IsOptional() @IsString()
  equipmentRequired?: string;

  @ApiProperty({ example: 'INTERMEDIO' })
  @IsString()
  difficultyLevel: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=example' })
  @IsOptional() @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/bench-press.jpg' })
  @IsOptional() @IsString()
  imageUrl?: string;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional({ example: 'Press Inclinado con Mancuernas' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Variación inclinada para pectoral superior' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Pecho' })
  @IsOptional() @IsString()
  muscleGroup?: string;

  @ApiPropertyOptional({ example: 'AVANZADO' })
  @IsOptional() @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
