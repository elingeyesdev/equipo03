import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWaitlistEntryDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del horario de actividad' })
  @IsInt()
  gymActivityScheduleId: number;

  @ApiPropertyOptional({ example: 1, description: 'Posición en la cola' })
  @IsOptional()
  @IsInt()
  positionInQueue?: number;
}

export class UpdateWaitlistStatusDto {
  @ApiProperty({
    example: 'ASSIGNED',
    description: 'WAITING | ASSIGNED | EXPIRED | CANCELLED',
  })
  @IsString()
  status: string;
}
