import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'tizanafresh-super-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Aquí puedes agregar lógica adicional de validación
    // Por ejemplo, verificar si el usuario aún existe en la base de datos
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
} 