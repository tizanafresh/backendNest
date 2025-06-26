import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'El token debe ser una cadena de texto' })
  token: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword: string;

  @IsString({ message: 'La confirmación de contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' })
  confirmPassword: string;
} 