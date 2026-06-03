import { IsString, IsInt, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckInDto {
  @ApiProperty({ example: 1, description: 'ID del usuario a registrar' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ example: 'QR', description: 'QR | BIOMETRICO | MANUAL | TARJETA' })
  @IsOptional()
  @IsString()
  @IsIn(['QR', 'BIOMETRICO', 'MANUAL', 'TARJETA'])
  method?: string;
}
