import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'BIENVENIDA' })
  @IsString()
  type: string;

  @ApiProperty({ example: '¡Bienvenido a {{gym_name}}!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Hola {{nombre}}, tu membresía en {{gym_name}} ha sido activada.' })
  @IsString()
  bodyTemplate: string;

  @ApiPropertyOptional({ example: 'push,email' })
  @IsOptional() @IsString()
  channel?: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la plantilla' })
  @IsOptional() @IsInt()
  templateId?: number;

  @ApiProperty({ example: 'Tu clase de Spinning comienza en 30 minutos' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Recuerda traer tu toalla y botella de agua.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'PUSH', description: 'PUSH | EMAIL | SMS' })
  @IsOptional() @IsString()
  channel?: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  marketingEnabled?: boolean;
}
