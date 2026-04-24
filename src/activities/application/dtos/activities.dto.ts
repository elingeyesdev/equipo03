import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ example: 1, description: 'ID del gimnasio' })
  @IsInt()
  gymId: number;

  @ApiProperty({ example: 'Spinning' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Clase de ciclismo indoor de alta intensidad' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional() @IsInt()
  defaultDurationMin?: number;
}

export class CreateActivityScheduleDto {
  @ApiPropertyOptional({ example: 1, description: 'ID del instructor' })
  @IsOptional() @IsInt()
  instructorId?: number;

  @ApiProperty({ example: 'LUNES' })
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ example: '07:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '07:45' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  maxAttendees: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isRecurring?: boolean;
}

export class RegisterAttendanceDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional() @IsString()
  status?: string;
}
