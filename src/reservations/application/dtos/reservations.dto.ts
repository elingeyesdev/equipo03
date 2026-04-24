import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del horario de actividad' })
  @IsInt()
  gymActivityScheduleId: number;

  @ApiProperty({ example: '2026-05-15' })
  @IsString()
  reservationDate: string;

  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional() @IsString()
  status?: string;
}
