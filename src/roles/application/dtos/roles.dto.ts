import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'gym:manage' })
  @IsString()
  @IsNotEmpty()
  declare code: string;

  @ApiProperty({ example: 'Gestionar Gimnasios' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiPropertyOptional({
    example: 'Permite crear, editar y eliminar gimnasios',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'gym' })
  @IsString()
  @IsNotEmpty()
  declare resource: string;

  @ApiProperty({ example: 'manage' })
  @IsString()
  @IsNotEmpty()
  declare action: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'TRAINER' })
  @IsString({ message: 'El nombre del rol debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @MinLength(3, { message: 'El nombre del rol debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre del rol no puede superar los 50 caracteres' })
  @Matches(/^[A-Z_]+$/, {
    message: 'El nombre solo puede contener mayúsculas y guiones bajos',
  })
  declare name: string;

  @ApiPropertyOptional({ example: 'Entrenador personal del gimnasio' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  @MaxLength(300, { message: 'La descripción no puede superar los 300 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    example: { canCreateRoutines: true, canViewMembers: true },
  })
  @IsOptional()
  permissions?: any;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  hierarchyLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'TRAINER' })
  @IsOptional()
  @IsString({ message: 'El nombre del rol debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @MinLength(3, { message: 'El nombre del rol debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre del rol no puede superar los 50 caracteres' })
  @Matches(/^[A-Z_]+$/, {
    message: 'El nombre solo puede contener mayúsculas y guiones bajos',
  })
  name?: string;

  @ApiPropertyOptional({ example: 'Entrenador personal del gimnasio' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MinLength(5, { message: 'La descripción debe tener al menos 5 caracteres' })
  @MaxLength(300, { message: 'La descripción no puede superar los 300 caracteres' })
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  permissions?: any;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  hierarchyLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  declare userId: number;

  @ApiProperty({ example: 1, description: 'ID del rol' })
  @IsInt()
  declare roleId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del gimnasio (rol scopeado)',
  })
  @IsOptional()
  @IsInt()
  gymId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del usuario que asigna' })
  @IsOptional()
  @IsInt()
  assignedBy?: number;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
