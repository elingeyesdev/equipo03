import { IsEmail, IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico único' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mi_password_seguro', description: 'Mínimo 6 caracteres' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'RASB', description: 'Nombre' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Admin', description: 'Apellido' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+591 70012345', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Masculino', description: 'Masculino | Femenino | Otro' })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'nuevo@corpusgym.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'nuevo_password_2026' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+591 70099999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: true, description: 'Activar o desactivar cuenta' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
