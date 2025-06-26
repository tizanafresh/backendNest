import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @MinLength(6, {
    message: 'La contraseña actual debe tener al menos 6 caracteres',
  })
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;

  @IsString({
    message: 'La confirmación de contraseña debe ser una cadena de texto',
  })
  @MinLength(6, {
    message: 'La confirmación de contraseña debe tener al menos 6 caracteres',
  })
  confirmPassword: string;
}
