import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
console.log('Archivos en el directorio actual:', fs.readdirSync(process.cwd()));
try {
  console.log('Contenido de .env:', fs.readFileSync('.env', 'utf8'));
} catch (e) {
  console.log('No se pudo leer el archivo .env:', e.message);
}
console.log('MONGODB_URI desde process.env:', process.env.MONGODB_URI);
console.log('JWT_SECRET desde process.env:', process.env.JWT_SECRET);
console.log('MAIL_HOST desde process.env:', process.env.MAIL_HOST);
console.log('MAIL_USERNAME desde process.env:', process.env.MAIL_USERNAME);
console.log('MAIL_PASSWORD desde process.env:', process.env.MAIL_PASSWORD);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Obtener el servicio de configuración
  const configService = app.get(ConfigService);
  
  // Debug: mostrar variables de entorno
  configService.debugEnvVariables();
  
  // Validar la configuración al inicio
  try {
    configService.validateConfig();
  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    process.exit(1);
  }

  // Configuración de CORS
  app.enableCors({
    origin: configService.corsOrigin,
    credentials: configService.corsCredentials,
  });

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: configService.validationConfig.transform,
      whitelist: configService.validationConfig.whitelist,
      forbidNonWhitelisted: configService.validationConfig.forbidNonWhitelisted,
    }),
  );

  // Configuración del prefijo global
  app.setGlobalPrefix('api');

  const port = configService.port|| 3000;
  await app.listen(port, "0.0.0.0");

  console.log('🚀 ========================================');
  console.log('🚀 TIZANAS FRESH BACKEND');
  console.log('🚀 ========================================');
  console.log(`🌍 Entorno: ${configService.nodeEnv}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`📧 Email configurado: ${configService.emailConfig.host}:${configService.emailConfig.port}`);
  console.log(`🔐 JWT expira en: ${configService.jwtExpiresIn}`);
  console.log(`📊 Base de datos: ${configService.databaseUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB Local'}`);
  console.log('🚀 ========================================');
  console.log('✅ Servidor iniciado exitosamente!');
  console.log('🚀 ========================================');
}

bootstrap();
