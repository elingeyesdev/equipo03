import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  Min,
  Matches,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsTimeAfter } from '../../../common/decorators/is-time-after.decorator';

export enum DayOfWeek {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}

const DAY_INPUT_MAP: Record<string, DayOfWeek> = {
  LUN: DayOfWeek.LUNES,
  LUNES: DayOfWeek.LUNES,
  MAR: DayOfWeek.MARTES,
  MARTES: DayOfWeek.MARTES,
  MIE: DayOfWeek.MIERCOLES,
  MIERCOLES: DayOfWeek.MIERCOLES,
  JUE: DayOfWeek.JUEVES,
  JUEVES: DayOfWeek.JUEVES,
  VIE: DayOfWeek.VIERNES,
  VIERNES: DayOfWeek.VIERNES,
  SAB: DayOfWeek.SABADO,
  SABADO: DayOfWeek.SABADO,
  DOM: DayOfWeek.DOMINGO,
  DOMINGO: DayOfWeek.DOMINGO,
};

export function normalizeDayOfWeekInput(value: unknown): DayOfWeek | undefined {
  if (value === undefined || value === null) return undefined;
  const key = String(value).trim().toUpperCase();
  return DAY_INPUT_MAP[key];
}

/** Todas las variantes que pueden existir en BD para el mismo día canónico (ej. LUNES + LUN). */
export function aliasesForCanonicalDay(canonical: DayOfWeek): string[] {
  const variants = new Set<string>([canonical]);
  for (const [token, mapped] of Object.entries(DAY_INPUT_MAP)) {
    if (mapped === canonical) variants.add(token);
  }
  return [...variants];
}

export class CreateActivityScheduleDto {
  @ApiProperty({
    description: 'ID del instructor asignado a esta clase',
    example: 5,
    minimum: 1,
  })
  @IsInt({ message: 'instructorId debe ser un número entero' })
  @IsPositive({ message: 'instructorId debe ser mayor a cero' })
  instructorId: number;

  @ApiProperty({
    description:
      'Día de la semana (nombre completo LUNES–DOMINGO o abreviatura LUN–DOM)',
    example: DayOfWeek.LUNES,
    enum: DayOfWeek,
  })
  @Transform(({ value }) => normalizeDayOfWeekInput(value) ?? value)
  @IsEnum(DayOfWeek, {
    message: `dayOfWeek debe ser uno de: ${Object.values(DayOfWeek).join(', ')} (también abreviaturas LUN–DOM)`,
  })
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Hora de inicio de la clase (formato 24h: HH:mm)',
    example: '08:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener formato HH:mm (ej: 08:00, 14:30, 23:59)',
  })
  @IsNotEmpty({ message: 'startTime es requerido' })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin de la clase (formato 24h: HH:mm)',
    example: '09:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener formato HH:mm (ej: 08:00, 14:30, 23:59)',
  })
  @IsNotEmpty({ message: 'endTime es requerido' })
  @IsTimeAfter('startTime', {
    message: 'endTime debe ser posterior a startTime',
  })
  endTime: string;

  @ApiProperty({
    description: 'Número máximo de participantes permitidos en esta clase',
    example: 20,
    minimum: 1,
  })
  @IsInt({ message: 'maxAttendees debe ser un número entero' })
  @Min(1, { message: 'El aforo mínimo permitido es 1 persona' })
  maxAttendees: number;

  @ApiPropertyOptional({
    description: 'Indica si este horario se repite semanalmente',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isRecurring debe ser booleano' })
  isRecurring?: boolean;
}
