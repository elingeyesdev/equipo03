import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkStatusDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  reservationIds!: number[];

  @ApiProperty({ example: 'COMPLETADA', enum: ['COMPLETADA', 'FALTO'] })
  @IsString()
  @IsIn(['COMPLETADA', 'FALTO'])
  status!: 'COMPLETADA' | 'FALTO';
}

export class WalkInDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  scheduleId!: number;
}

/** @deprecated Usar CheckInByTokenDto + POST /check-in/token */
export class CheckInReservationDto {
  @ApiProperty({ example: 42, description: 'ID de la reserva leído del QR' })
  @IsInt()
  reservationId!: number;
}

/** Body del endpoint seguro de escaneo QR con bloqueo pesimista. */
export class CheckInByTokenDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Token opaco (UUID) embebido en el QR de la reserva',
  })
  @IsString()
  token!: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Cuando es true, omite la validación de fecha y permite check-in de reservas futuras. ' +
      'Solo procesado si el operador tiene nivel >= 4.',
  })
  @IsOptional()
  @IsBoolean()
  forceCheckIn?: boolean;
}

export class CreateReservationDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'ID del cliente a reservar. Obligatorio para GERENTE; ignorado para CLIENTE (usa su propio ID del JWT).',
  })
  @IsOptional()
  @IsInt()
  targetUserId?: number;

  @ApiPropertyOptional({
    example: 3,
    description:
      'ID del horario fijo de actividad. Requerido en flujo estándar. ' +
      'Si se omite, proporciona gymId + startTime + endTime para flujo abierto.',
  })
  @IsOptional()
  @IsInt()
  gymActivityScheduleId?: number;

  @ApiProperty({
    example: '2026-05-25',
    description: 'Fecha de la reserva (YYYY-MM-DD)',
  })
  @IsString()
  reservationDate!: string;

  @ApiPropertyOptional({ example: 'CONFIRMADA' })
  @IsOptional()
  @IsString()
  status?: string;

  // ── Flujo libre (isFreeAccess) ──────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 7,
    description:
      'ID de la actividad. Requerido en flujo libre (isFreeAccess). ' +
      'Si la actividad tiene isFreeAccess=false se lanza error.',
  })
  @IsOptional()
  @IsInt()
  activityId?: number;

  // ── Campos para flujo abierto (cuando no se conoce gymActivityScheduleId) ──

  @ApiPropertyOptional({
    example: 1,
    description:
      'ID de la sede. Requerido solo en flujo abierto (sin gymActivityScheduleId).',
  })
  @IsOptional()
  @IsInt()
  gymId?: number;

  @ApiPropertyOptional({
    example: '10:00',
    description:
      'Hora de inicio (HH:mm). ' +
      'OBLIGATORIO para actividades isFreeAccess=true. ' +
      'IGNORADO en clases programadas (se toma del Schedule en BD).',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener formato HH:mm',
  })
  startTime?: string;

  @ApiPropertyOptional({
    example: '11:00',
    description:
      'Hora de fin (HH:mm). ' +
      'OBLIGATORIO para actividades isFreeAccess=true. ' +
      'IGNORADO en clases programadas (se toma del Schedule en BD).',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener formato HH:mm',
  })
  endTime?: string;
}
