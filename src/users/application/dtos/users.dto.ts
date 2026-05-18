import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsBoolean,
  IsInt,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
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

  @ApiProperty({ example: 3, description: 'ID del rol en la tabla roles' })
  @IsInt()
  roleId: number;

  @ApiPropertyOptional({ example: [1, 2], description: 'Sedes (vacío si el rol es global ante el gimnasio)' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(100)
  gymIds?: number[];

  @ApiPropertyOptional({ example: true, description: 'Alta como usuario activo' })
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

  @ApiPropertyOptional({ example: 3, description: 'ID del rol en la tabla roles (usar junto con gymIds para sincronizar)' })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({ example: [1], description: 'Sedes ligadas al rol; debe enviarse junto con roleId para aplicar cambios de rol' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(100)
  gymIds?: number[];
}
