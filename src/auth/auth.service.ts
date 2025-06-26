import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/user.schema';
import { PasswordReset, PasswordResetDocument } from '../schemas/password-reset.schema';
import { UserService } from './user.service';
import { EmailService } from './email.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto';

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
    @InjectModel(PasswordReset.name) private passwordResetModel: Model<PasswordResetDocument>,
    private userService: UserService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Buscar usuario en la base de datos
    const user = await this.userModel.findOne({ email }).exec();
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  login(user: any): LoginResponse {
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
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Verificar si el usuario existe
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return { message: 'Si el email está registrado, recibirás un enlace de recuperación' };
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Calcular fecha de expiración (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidar tokens anteriores del mismo usuario
    await this.passwordResetModel.updateMany(
      { email, used: false },
      { used: true, usedAt: new Date() }
    );

    // Crear nuevo token de recuperación
    const passwordReset = new this.passwordResetModel({
      email,
      token: resetToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await passwordReset.save();

    // Enviar email
    const emailSent = await this.emailService.sendPasswordResetEmail(
      email,
      resetToken,
      user.name,
      ipAddress,
      userAgent,
    );

    if (!emailSent) {
      // Si falla el envío, marcar el token como usado
      await this.passwordResetModel.findByIdAndUpdate(passwordReset._id, {
        used: true,
        usedAt: new Date(),
      });
      throw new BadRequestException('Error al enviar el email de recuperación');
    }

    return { message: 'Si el email está registrado, recibirás un enlace de recuperación' };
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Buscar token válido
    const passwordReset = await this.passwordResetModel.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Verificar si el usuario existe
    const user = await this.userModel.findOne({ email: passwordReset.email });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña del usuario
    await this.userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Marcar token como usado
    await this.passwordResetModel.findByIdAndUpdate(passwordReset._id, {
      used: true,
      usedAt: new Date(),
    });

    // Enviar email de confirmación
    await this.emailService.sendPasswordChangedEmail(
      user.email,
      user.name,
      ipAddress,
      userAgent,
    );

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Verificar si un token de recuperación es válido
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const passwordReset = await this.passwordResetModel.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!passwordReset) {
      return { valid: false };
    }

    return { valid: true, email: passwordReset.email };
  }
}
