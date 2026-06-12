import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
  @ApiPropertyOptional({ example: 1, description: 'ID de la rutina. Omitir para entrenamiento libre.' })
  @IsOptional() @IsInt()
  routineId?: number;

  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID del gimnasio' })
  @IsInt()
  gymId: number;

  @ApiPropertyOptional({ example: 'MUSCULACION', description: 'MUSCULACION | CINTA | BICICLETA | NATACION | YOGA | OTRO' })
  @IsOptional() @IsString()
  sportType?: string;

  @ApiPropertyOptional({ example: 'Sesión de prueba' })
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: 'COMPLETED', description: 'IN_PROGRESS | COMPLETED | CANCELLED' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 3720, description: 'Duración total en segundos' })
  @IsOptional() @IsInt()
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 420, description: 'Calorías quemadas estimadas' })
  @IsOptional() @IsInt()
  caloriesBurned?: number;

  @ApiPropertyOptional({ example: 'Gran sesión, superé marcas' })
  @IsOptional() @IsString()
  notes?: string;
}

export class SaveCompletedSessionDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la rutina. Omitir para entrenamiento libre.' })
  @IsOptional() @IsInt()
  routineId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del gimnasio. Si se omite, se resuelve desde la membresía activa del usuario.' })
  @IsOptional() @IsInt()
  gymId?: number;

  @ApiPropertyOptional({ example: 'MUSCULACION', description: 'MUSCULACION | CINTA | BICICLETA | NATACION | YOGA | OTRO' })
  @IsOptional() @IsString()
  sportType?: string;

  @ApiPropertyOptional({ example: 3720, description: 'Duración total en segundos' })
  @IsOptional() @IsInt()
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 420, description: 'Calorías quemadas estimadas' })
  @IsOptional() @IsInt()
  caloriesBurned?: number;

  @ApiPropertyOptional({ example: 'Gran sesión, superé marcas' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Series completadas durante el entrenamiento', type: () => [AddSetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddSetDto)
  sets?: AddSetDto[];
}

export class AddSetDto {
  @ApiPropertyOptional({ example: 1, description: 'ID del routine_exercise. Omitir en entrenamientos libres.' })
  @IsOptional() @IsInt()
  routineExerciseId?: number;

  @ApiPropertyOptional({ example: 5, description: 'ID del ejercicio del catálogo. Usar en entrenamientos libres.' })
  @IsOptional() @IsInt()
  exerciseId?: number;

  @ApiPropertyOptional({ example: 'Press de Banca', description: 'Nombre del ejercicio (solo para compatibilidad con el frontend móvil, no se persiste explícitamente en la BD).' })
  @IsOptional() @IsString()
  exerciseName?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  setNumber: number;

  @ApiPropertyOptional({ example: 10, description: 'Repeticiones completadas. Omitir en isométricos o cardio.' })
  @IsOptional() @IsInt()
  repsCompleted?: number;

  @ApiPropertyOptional({ example: 80.5, description: 'Peso en kg. Omitir en ejercicios sin carga.' })
  @IsOptional() @IsNumber()
  weightUsedKg?: number;

  @ApiPropertyOptional({ example: 60, description: 'Duración en segundos. Para isométricos o cardio.' })
  @IsOptional() @IsInt()
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 500, description: 'Distancia en metros. Para cardio métrico.' })
  @IsOptional() @IsInt()
  distanceMeters?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @IsInt()
  restTakenSeconds?: number;

  @ApiPropertyOptional({ example: 7, description: 'RPE 1-10' })
  @IsOptional() @IsInt()
  ratingPerceivedExertion?: number;

  @ApiPropertyOptional({ example: { asistidaMaquina: true, lastre: '5kg' }, description: 'Datos arbitrarios del set.' })
  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}
