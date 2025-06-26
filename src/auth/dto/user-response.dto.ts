import { Exclude, Expose, Transform } from 'class-transformer';
import { UserLevel } from './register.dto';

export class UserResponseDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  phone?: string;

  @Expose()
  @Transform(({ value }) => parseInt(value))
  points: number;

  @Expose()
  level: UserLevel;

  @Expose()
  qrCode: string;

  @Expose()
  favorites?: string[];

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  createdAt?: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  updatedAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
