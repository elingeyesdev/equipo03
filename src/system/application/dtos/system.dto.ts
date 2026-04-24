import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ example: 'max_check_ins_per_day' })
  @IsString()
  settingKey: string;

  @ApiProperty({ example: { value: 3, description: 'Máximo de check-ins por día por usuario' } })
  settingValue: any;

  @ApiPropertyOptional({ example: 'system' })
  @IsOptional() @IsString()
  category?: string;
}

export class UpdateSettingDto {
  @ApiProperty({ example: { value: 5, description: 'Actualizado a 5 check-ins' } })
  settingValue: any;

  @ApiPropertyOptional({ example: 1, description: 'ID del usuario que actualiza' })
  @IsOptional() @IsInt()
  updatedBy?: number;
}
