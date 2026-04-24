import { IsString, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'gym:manage' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Gestionar Gimnasios' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Permite crear, editar y eliminar gimnasios' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'gym' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'manage' })
  @IsString()
  action: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'TRAINER' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Entrenador personal del gimnasio' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { canCreateRoutines: true, canViewMembers: true } })
  @IsOptional()
  permissions?: any;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @IsInt()
  hierarchyLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isSystemRole?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del rol' })
  @IsInt()
  roleId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del gimnasio (rol scopeado)' })
  @IsOptional() @IsInt()
  gymId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del usuario que asigna' })
  @IsOptional() @IsInt()
  assignedBy?: number;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00Z' })
  @IsOptional() @IsString()
  expiresAt?: string;
}
