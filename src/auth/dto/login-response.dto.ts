import { Expose } from 'class-transformer';

export class LoginResponseDto {
  @Expose()
  access_token: string;

  @Expose()
  user: {
    id: string;
    email: string;
    role: string;
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
