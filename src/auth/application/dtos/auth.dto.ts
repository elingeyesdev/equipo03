import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mi_password_seguro', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'RASB', description: 'Nombre del usuario' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Admin', description: 'Apellido del usuario' })
  @IsString()
  lastName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico registrado' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mi_password_seguro', description: 'Contraseña del usuario' })
  @IsString()
  password: string;
}
