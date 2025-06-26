import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserLevel } from './register.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Los puntos deben ser un número' })
  @Min(0, { message: 'Los puntos no pueden ser negativos' })
  @Transform(({ value }) => parseInt(value))
  points?: number;

  @IsOptional()
  @IsEnum(UserLevel, {
    message: 'El nivel debe ser uno de: BRONZE, SILVER, GOLD, PLATINUM',
  })
  level?: UserLevel;

  @IsOptional()
  @IsString({ message: 'El código QR debe ser una cadena de texto' })
  qrCode?: string;
}
