import { IsInt, Min, Max, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre o email (ILIKE)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 2, description: 'Filtrar por ID de rol' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filtrar por nivel jerárquico' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hierarchyLevel?: number;

  @ApiPropertyOptional({ description: 'true → usuarios sin rol asignado' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  noRole?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de sede' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gymId?: number;

  @ApiPropertyOptional({ description: 'active | inactive' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'az | za | id_asc | id_desc' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 20, description: 'Resultados por página (máx. 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 0, description: 'Número de resultados a omitir' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
