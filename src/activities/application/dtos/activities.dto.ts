import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export {
  CreateActivityScheduleDto,
  DayOfWeek,
  normalizeDayOfWeekInput,
} from './create-activity-schedule.dto';

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

export class RegisterAttendanceDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional() @IsString()
  status?: string;
}
