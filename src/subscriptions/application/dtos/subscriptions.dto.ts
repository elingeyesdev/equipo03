import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plan Premium Mensual' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Acceso total, clases grupales, locker premium',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 350.0, description: 'Precio en moneda local' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 30, description: 'Duración en días' })
  @IsInt()
  durationDays: number;

  @ApiPropertyOptional({
    example: { clases_grupales: true, locker: true, sauna: false },
  })
  @IsOptional()
  features?: any;
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del plan' })
  @IsInt()
  planId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del gimnasio sede' })
  @IsOptional()
  @IsInt()
  homeGymId?: number;

  @ApiProperty({ example: '2026-05-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'ACTIVE | EXPIRED | FROZEN | CANCELLED',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'FROZEN' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 350.0 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'BOB', description: 'Moneda' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    example: 'TRANSFERENCIA',
    description: 'EFECTIVO | TRANSFERENCIA | QR | TARJETA',
  })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'REF-2026-001' })
  @IsOptional()
  @IsString()
  transactionReference?: string;
}
