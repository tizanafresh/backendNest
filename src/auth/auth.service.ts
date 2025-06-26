import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Buscar usuario en la base de datos
    const user = await this.userModel.findOne({ email }).exec();
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user._id || user.id,
      email: user.email,
      role: user.level || 'USER', // Usar level como role
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id || user.id,
        email: user.email,
        role: user.level || 'USER',
      },
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
} 