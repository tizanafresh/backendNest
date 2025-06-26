import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;
} 