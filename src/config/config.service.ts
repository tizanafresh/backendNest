import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // Métodos para acceder a las variables de entorno con validación
  get port(): number {
    return this.configService.get<number>('PORT', 5001);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // Base de datos
  get databaseUri(): string {
    const uri = this.configService.get<string>('MONGODB_URI');
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada en las variables de entorno');
    }
    return uri;
  }

  // JWT
  get jwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret || secret === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error('JWT_SECRET no está configurada correctamente');
    }
    return secret;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '24h');
  }

  // Email
  get emailConfig() {
    return {
      mailer: this.configService.get<string>('MAIL_MAILER', 'smtp'),
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      username: this.configService.get<string>('MAIL_USERNAME'),
      password: this.configService.get<string>('MAIL_PASSWORD'),
      encryption: this.configService.get<string>('MAIL_ENCRYPTION', 'tls'),
      fromAddress: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      fromName: this.configService.get<string>('MAIL_FROM_NAME', 'Tizanas Fresh'),
      secure: this.configService.get<string>('MAIL_ENCRYPTION') === 'ssl' || this.configService.get<string>('SMTP_SECURE') === 'true',
    };
  }

  // Aplicación
  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'Tizanas Fresh');
  }

  get appUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:5001');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  // Seguridad
  get bcryptRounds(): number {
    return this.configService.get<number>('BCRYPT_ROUNDS', 12);
  }

  get passwordResetExpiresIn(): number {
    return this.configService.get<number>('PASSWORD_RESET_EXPIRES_IN', 3600000);
  }

  // CORS
  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  }

  get corsCredentials(): boolean {
    return this.configService.get<string>('CORS_CREDENTIALS') === 'true';
  }

  // Rate Limiting
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 60);
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('RATE_LIMIT_LIMIT', 100);
  }

  // Validación
  get validationConfig() {
    return {
      transform: this.configService.get<string>('VALIDATION_PIPE_TRANSFORM') === 'true',
      whitelist: this.configService.get<string>('VALIDATION_PIPE_WHITELIST') === 'true',
      forbidNonWhitelisted: this.configService.get<string>('VALIDATION_PIPE_FORBID_NON_WHITELISTED') === 'true',
    };
  }

  // Paginación
  get defaultPageSize(): number {
    return this.configService.get<number>('DEFAULT_PAGE_SIZE', 10);
  }

  get maxPageSize(): number {
    return this.configService.get<number>('MAX_PAGE_SIZE', 100);
  }

  // Archivos
  get uploadDest(): string {
    return this.configService.get<string>('UPLOAD_DEST', 'uploads');
  }

  get maxFileSize(): number {
    return this.configService.get<number>('MAX_FILE_SIZE', 5242880);
  }

  // Método para validar toda la configuración
  validateConfig(): void {
    const requiredConfigs = [
      { name: 'MongoDB URI', value: this.databaseUri },
      { name: 'JWT Secret', value: this.jwtSecret },
      { name: 'Email Host', value: this.emailConfig.host },
      { name: 'Email Username', value: this.emailConfig.username },
      { name: 'Email Password', value: this.emailConfig.password },
    ];

    const missingConfigs = requiredConfigs.filter(config => !config.value);

    if (missingConfigs.length > 0) {
      const missingNames = missingConfigs.map(config => config.name).join(', ');
      throw new Error(`Configuración faltante: ${missingNames}`);
    }

    console.log('✅ Configuración validada correctamente');
  }

  // Método para obtener toda la configuración como objeto
  getAllConfig() {
    return {
      port: this.port,
      nodeEnv: this.nodeEnv,
      database: {
        uri: this.databaseUri,
      },
      jwt: {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      },
      email: this.emailConfig,
      app: {
        name: this.appName,
        url: this.appUrl,
        frontendUrl: this.frontendUrl,
      },
      security: {
        bcryptRounds: this.bcryptRounds,
        passwordResetExpiresIn: this.passwordResetExpiresIn,
      },
      cors: {
        origin: this.corsOrigin,
        credentials: this.corsCredentials,
      },
      rateLimit: {
        ttl: this.rateLimitTtl,
        limit: this.rateLimitLimit,
      },
      validation: this.validationConfig,
      pagination: {
        defaultPageSize: this.defaultPageSize,
        maxPageSize: this.maxPageSize,
      },
      upload: {
        dest: this.uploadDest,
        maxFileSize: this.maxFileSize,
      },
    };
  }

  // Método para debug - mostrar todas las variables de entorno
  debugEnvVariables(): void {
    console.log('🔍 Debug - Variables de entorno disponibles:');
    console.log('MONGODB_URI:', this.configService.get('MONGODB_URI'));
    console.log('JWT_SECRET:', this.configService.get('JWT_SECRET'));
    console.log('MAIL_HOST:', this.configService.get('MAIL_HOST'));
    console.log('MAIL_USERNAME:', this.configService.get('MAIL_USERNAME'));
    console.log('MAIL_PASSWORD:', this.configService.get('MAIL_PASSWORD'));
    
    console.log('🔍 Debug - Valores obtenidos:');
    console.log('databaseUri:', this.databaseUri);
    console.log('jwtSecret:', this.jwtSecret);
    console.log('emailConfig.host:', this.emailConfig.host);
  }
} 