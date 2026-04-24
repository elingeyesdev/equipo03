import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Training Profile ─────────────────────────────────────
export class CreateTrainingGoalsDto {
  @ApiProperty({ example: 'GANANCIA_MUSCULAR' })
  @IsString()
  primaryGoal: string;

  @ApiProperty({ example: 'INTERMEDIO' })
  @IsString()
  experienceLevel: string;
}

export class CreateTrainingPreferencesDto {
  @ApiPropertyOptional({ example: ['Musculación', 'HIIT'] })
  @IsOptional() @IsArray()
  preferredTrainingTypes?: string[];

  @ApiPropertyOptional({ example: ['Pecho', 'Espalda'] })
  @IsOptional() @IsArray()
  priorityBodyAreas?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsInt()
  availableDaysPerWeek?: number;
}

export class CreateTrainingProfileDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    type: CreateTrainingGoalsDto,
    example: { primaryGoal: 'GANANCIA_MUSCULAR', experienceLevel: 'INTERMEDIO' },
  })
  @IsOptional()
  goals?: CreateTrainingGoalsDto;

  @ApiPropertyOptional({
    type: CreateTrainingPreferencesDto,
    example: { preferredTrainingTypes: ['Musculación', 'HIIT'], priorityBodyAreas: ['Pecho', 'Espalda'], availableDaysPerWeek: 5 },
  })
  @IsOptional()
  preferences?: CreateTrainingPreferencesDto;
}

// ── Restrictions ─────────────────────────────────────────
export class CreateRestrictionDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'LESION' })
  @IsString()
  restrictionType: string;

  @ApiPropertyOptional({ example: 'Hernia discal L4-L5' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['Lumbar', 'Espalda baja'] })
  @IsOptional() @IsArray()
  affectedBodyAreas?: string[];

  @ApiPropertyOptional({ example: ['Peso muerto', 'Buenos días'] })
  @IsOptional() @IsArray()
  movementsToAvoid?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  requiresTrainerApproval?: boolean;
}

// ── Emergency Contacts ──────────────────────────────────
export class CreateEmergencyContactDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'María López' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+591 70012345' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Madre' })
  @IsString()
  relation: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}

// ── Workout Sessions ────────────────────────────────────
export class CreateSessionDto {
  @ApiProperty({ example: 1, description: 'ID de la rutina' })
  @IsInt()
  routineId: number;

  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del gimnasio' })
  @IsInt()
  gymId: number;

  @ApiPropertyOptional({ example: 'Sesión de prueba' })
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: 'COMPLETED', description: 'IN_PROGRESS | COMPLETED | CANCELLED' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional() @IsInt()
  totalDurationMinutes?: number;

  @ApiPropertyOptional({ example: 'Gran sesión, superé marcas' })
  @IsOptional() @IsString()
  notes?: string;
}

export class AddSetDto {
  @ApiProperty({ example: 1, description: 'ID del routine_exercise' })
  @IsInt()
  routineExerciseId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  setNumber: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  repsCompleted: number;

  @ApiPropertyOptional({ example: 80.5 })
  @IsOptional() @IsNumber()
  weightUsedKg?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @IsInt()
  restTakenSeconds?: number;

  @ApiPropertyOptional({ example: 7, description: 'RPE 1-10' })
  @IsOptional() @IsInt()
  ratingPerceivedExertion?: number;
}
