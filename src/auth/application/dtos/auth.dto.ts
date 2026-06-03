import { IsEmail, IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_MSG   = 'La contraseña debe tener al menos 8 caracteres, un número y un carácter especial';

export class RegisterDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiClave123!', description: 'Mínimo 8 caracteres, 1 número y 1 carácter especial' })
  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password: string;

  @ApiProperty({ example: 'RASB', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Admin', description: 'Apellido del usuario' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@corpusgym.com', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiClave123!', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@corpusgym.com', description: 'Correo del usuario que olvidó su contraseña' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'usuario@corpusgym.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: '849201', description: 'Código OTP de 6 dígitos recibido por correo' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'otpCode debe tener exactamente 6 dígitos' })
  otpCode: string;

  @ApiProperty({ example: 'NuevaClave123!', description: 'Nueva contraseña (mínimo 8 caracteres, 1 número y 1 carácter especial)' })
  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  newPassword: string;
}
