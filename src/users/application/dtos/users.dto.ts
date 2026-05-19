import { IsEmail, IsString, IsOptional, MinLength, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ example: 1, description: 'ID del rol asignado al usuario' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Array de IDs de gimnasios asignados al usuario' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  gymIds?: number[];

  @ApiPropertyOptional({ example: true, description: 'Estado de activación del usuario' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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

  @ApiPropertyOptional({ example: 2, description: 'ID del rol asignado al usuario' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional({ example: [1, 2], description: 'Array de IDs de gimnasios asignados al usuario' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  gymIds?: number[];
}
