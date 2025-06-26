import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuración para desarrollo (usando Ethereal Email)
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    
    if (isDevelopment) {
      // Configuración para desarrollo - usar Ethereal Email
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.configService.get<string>('ETHEREAL_USER') || 'test@ethereal.email',
          pass: this.configService.get<string>('ETHEREAL_PASS') || 'test123',
        },
      });
    } else {
      // Configuración para producción usando las variables proporcionadas
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST') || this.configService.get<string>('SMTP_HOST'),
        port: parseInt(this.configService.get<string>('MAIL_PORT') || this.configService.get<string>('SMTP_PORT') || '587'),
        secure: this.configService.get<string>('MAIL_ENCRYPTION') === 'ssl' || this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get<string>('MAIL_USERNAME') || this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('MAIL_PASSWORD') || this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const emailContent = this.generatePasswordResetEmail(userName, resetUrl);
      
      const mailOptions = {
        from: this.configService.get<string>('MAIL_FROM_ADDRESS') || this.configService.get<string>('EMAIL_FROM') || 'noreply@tizanafresh.com',
        to: email,
        subject: 'Recuperación de Contraseña - Tizanas Fresh',
        html: emailContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Password reset email sent to ${email}. Message ID: ${info.messageId}`);
      
      // Log de seguridad
      this.logger.log(`Password reset requested for ${email} from IP: ${ipAddress}, User-Agent: ${userAgent}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    try {
      const emailContent = this.generatePasswordChangedEmail(userName);
      
      const mailOptions = {
        from: this.configService.get<string>('MAIL_FROM_ADDRESS') || this.configService.get<string>('EMAIL_FROM') || 'noreply@tizanafresh.com',
        to: email,
        subject: 'Contraseña Cambiada - Tizanas Fresh',
        html: emailContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Password changed notification sent to ${email}. Message ID: ${info.messageId}`);
      
      // Log de seguridad
      this.logger.log(`Password changed for ${email} from IP: ${ipAddress}, User-Agent: ${userAgent}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${email}:`, error);
      return false;
    }
  }

  private generatePasswordResetEmail(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - Tizanas Fresh</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #e74c3c;
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title {
            color: #2c3e50;
            font-size: 1.5em;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #e74c3c;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #c0392b;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍹 Tizanas Fresh</div>
            <h1 class="title">Recuperación de Contraseña</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>Hemos recibido una solicitud para restablecer tu contraseña en Tizanas Fresh.</p>
            
            <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en 1 hora por seguridad</li>
                <li>No compartas este enlace con nadie</li>
                <li>Si no puedes hacer clic en el botón, copia y pega este enlace: ${resetUrl}</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes alguna pregunta, contacta a nuestro equipo de soporte.</p>
            <p>&copy; 2024 Tizanas Fresh. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordChangedEmail(userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Cambiada - Tizanas Fresh</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #e74c3c;
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title {
            color: #2c3e50;
            font-size: 1.5em;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .success {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍹 Tizanas Fresh</div>
            <h1 class="title">Contraseña Cambiada Exitosamente</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>Tu contraseña ha sido cambiada exitosamente en tu cuenta de Tizanas Fresh.</p>
            
            <div class="success">
              <strong>✅ Confirmación:</strong>
              <p>Tu nueva contraseña ya está activa y puedes usarla para iniciar sesión.</p>
            </div>
            
            <p>Si no realizaste este cambio, contacta inmediatamente a nuestro equipo de soporte.</p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes alguna pregunta, contacta a nuestro equipo de soporte.</p>
            <p>&copy; 2024 Tizanas Fresh. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 