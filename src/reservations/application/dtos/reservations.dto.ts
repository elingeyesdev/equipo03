import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'ID del cliente a reservar. Obligatorio para GERENTE; ignorado para CLIENTE (usa su propio ID del JWT).',
  })
  @IsOptional()
  @IsInt()
  targetUserId?: number;

  @ApiProperty({ example: 1, description: 'ID del horario de actividad' })
  @IsInt()
  gymActivityScheduleId: number;

  @ApiProperty({ example: '2026-05-15' })
  @IsString()
  reservationDate: string;

  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional()
  @IsString()
  status?: string;
}
