import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckInDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del gimnasio' })
  @IsInt()
  gymId: number;

  @ApiPropertyOptional({ example: 'QR', description: 'QR | BIOMETRICO | MANUAL | TARJETA' })
  @IsOptional() @IsString()
  checkInMethod?: string;
}
