import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MinLength,
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

  @ApiPropertyOptional({ example: 'Permite crear, editar y eliminar gimnasios' })
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
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[A-Z_]+$/, { message: 'El nombre solo puede contener mayúsculas y guiones bajos' })
  declare name: string;

  @ApiPropertyOptional({ example: 'Entrenador personal del gimnasio' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @ApiPropertyOptional({ example: { canCreateRoutines: true, canViewMembers: true } })
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
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[A-Z_]+$/, { message: 'El nombre solo puede contener mayúsculas y guiones bajos' })
  name?: string;

  @ApiPropertyOptional({ example: 'Entrenador personal del gimnasio' })
  @IsOptional()
  @IsString()
  @MinLength(5)
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

  @ApiPropertyOptional({ example: 1, description: 'ID del gimnasio (rol scopeado)' })
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
