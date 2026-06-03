import {
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsArray,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_MSG   = 'La contraseña debe tener mínimo 8 caracteres, incluir un número y un carácter especial';
const CI_REGEX       = /^\d{6,9}(-[a-zA-Z0-9]{1,2})?$/;
const CI_MSG         = 'Formato de documento de identidad inválido';
const PHONE_MSG      = 'El número de teléfono debe ser un formato internacional válido (ej. +59170000000)';

export class UpdatePushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', description: 'Token de Expo para notificaciones push' })
  @IsString()
  token!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+59170099999' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: PHONE_MSG })
  phone?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional({ example: 18.4 })
  @IsOptional()
  @IsNumber()
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 38.2 })
  @IsOptional()
  @IsNumber()
  muscleMassKg?: number;

  @ApiPropertyOptional({ example: 82.0 })
  @IsOptional()
  @IsNumber()
  waistCm?: number;

  @ApiPropertyOptional({ example: 95.0 })
  @IsOptional()
  @IsNumber()
  chestCm?: number;

  @ApiPropertyOptional({ example: 'Medición post-ciclo' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '1234567' })
  @IsOptional()
  @Matches(CI_REGEX, { message: CI_MSG })
  ci?: string;

  @ApiPropertyOptional({ example: 170.5 })
  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @ApiPropertyOptional({ example: 'INTERMEDIO', description: 'PRINCIPIANTE | INTERMEDIO | AVANZADO' })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({ example: 'Diabetes tipo 2, hipertensión' })
  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @ApiPropertyOptional({ example: ['Fútbol', 'Natación'] })
  @IsOptional()
  @IsArray()
  favoriteSports?: string[];

  @ApiPropertyOptional({ example: 'avatar_3.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'carl0s_fit' })
  @IsOptional()
  @IsString()
  username?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico único' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  email!: string;

  @ApiProperty({ example: 'MiClave123!', description: 'Mínimo 8 caracteres, 1 número y 1 carácter especial' })
  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @ApiProperty({ example: 'RASB', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Admin', description: 'Apellido' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: '+59170012345', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: PHONE_MSG })
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

  @ApiPropertyOptional({ example: '1234567' })
  @IsOptional()
  @Matches(CI_REGEX, { message: CI_MSG })
  ci?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'nuevo@corpusgym.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  email?: string;

  @ApiPropertyOptional({ example: 'NuevaClave123!' })
  @IsOptional()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password?: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+59170099999' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: PHONE_MSG })
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

  @ApiPropertyOptional({ example: '1234567' })
  @IsOptional()
  @Matches(CI_REGEX, { message: CI_MSG })
  ci?: string;
}
