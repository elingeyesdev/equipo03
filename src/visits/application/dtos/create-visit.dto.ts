import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVisitDto {
  @ApiProperty({
    description: 'ID del gimnasio visitado (detectado por GPS)',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  gymId: number;

  @ApiProperty({
    description: 'Timestamp de entrada al gimnasio (ISO 8601)',
    example: '2026-05-28T18:30:00.000Z',
  })
  @IsISO8601()
  enteredAt: string;

  @ApiPropertyOptional({
    description: 'Timestamp de salida del gimnasio (ISO 8601). Puede omitirse si la visita aún está en curso.',
    example: '2026-05-28T20:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  exitedAt?: string;

  @ApiPropertyOptional({
    description: 'Duración de la visita en minutos, calculada por el cliente GPS',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  durationMin?: number;
}
