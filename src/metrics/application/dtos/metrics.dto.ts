import { IsOptional, IsInt, IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMetricDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del gimnasio donde se tomó',
  })
  @IsOptional()
  @IsInt()
  gymId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del entrenador que registró',
  })
  @IsOptional()
  @IsInt()
  measuredBy?: number;

  @ApiPropertyOptional({ example: 78.5 })
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional({ example: 175.0 })
  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @ApiPropertyOptional({ example: 15.2, description: '% grasa corporal' })
  @IsOptional()
  @IsNumber()
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 40.0, description: 'Cintura cm' })
  @IsOptional()
  @IsNumber()
  waistCm?: number;

  @ApiPropertyOptional({ example: 100.0, description: 'Pecho cm' })
  @IsOptional()
  @IsNumber()
  chestCm?: number;

  @ApiPropertyOptional({ example: 37.5, description: 'Bíceps cm' })
  @IsOptional()
  @IsNumber()
  bicepsCm?: number;

  @ApiPropertyOptional({ example: 60.0, description: 'Muslo cm' })
  @IsOptional()
  @IsNumber()
  thighCm?: number;

  @ApiPropertyOptional({ example: 'Control mensual de composición corporal' })
  @IsOptional()
  @IsString()
  notes?: string;
}
