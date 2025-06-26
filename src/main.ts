import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: appConfig.cors.origin,
    credentials: appConfig.cors.credentials,
  });

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: appConfig.validation.transform,
      whitelist: appConfig.validation.whitelist,
      forbidNonWhitelisted: appConfig.validation.forbidNonWhitelisted,
    }),
  );

  // Configuración del prefijo global
  app.setGlobalPrefix('api');

  const port = appConfig.port;
  await app.listen(port);

  console.log('🚀 ========================================');
  console.log('🚀 TIZANAS FRESH BACKEND');
  console.log('🚀 ========================================');
  console.log(`🌍 Entorno: ${appConfig.nodeEnv}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`📧 Email configurado: ${appConfig.email.host}:${appConfig.email.port}`);
  console.log(`🔐 JWT expira en: ${appConfig.jwt.expiresIn}`);
  console.log(`📊 Base de datos: ${appConfig.database.uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB Local'}`);
  console.log('🚀 ========================================');
  console.log('✅ Servidor iniciado exitosamente!');
  console.log('🚀 ========================================');
}

bootstrap();
