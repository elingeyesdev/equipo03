import { IsString, IsInt, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckInDto {
  @ApiProperty({ example: 1, description: 'ID del usuario a registrar' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    example: 'QR',
    description: 'QR | BIOMETRICO | MANUAL | TARJETA',
  })
  @IsOptional()
  @IsString()
  @IsIn(['QR', 'BIOMETRICO', 'MANUAL', 'TARJETA'])
  method?: string;
}

export class ScanPreviewDto {
  @ApiProperty({ example: '42', description: 'Token del QR escaneado (ID numérico del empleado)' })
  @IsString()
  token: string;
}

export class RegisterAttendanceDto {
  @ApiProperty({ example: 42, description: 'ID del usuario objetivo' })
  @IsInt()
  targetUserId: number;

  @ApiProperty({ example: 'IN', enum: ['IN', 'OUT'], description: 'IN = ingreso, OUT = salida' })
  @IsString()
  @IsIn(['IN', 'OUT'])
  action: 'IN' | 'OUT';
}
