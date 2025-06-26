import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  // Log de variables de entorno para debug
  console.log('🚀 Starting Tizanas Fresh Backend...');
  console.log('📋 Environment variables:');
  console.log('   PORT:', appConfig.port);
  console.log('   MONGODB_URI:', appConfig.mongodb.uri ? '✅ Loaded' : '❌ Not found');
  console.log('   ENVIRONMENT:', appConfig.environment);
  
  const app = await NestFactory.create(AppModule);
  
  await app.listen(appConfig.port);
  
  console.log(`✅ Server running on http://localhost:${appConfig.port}`);
  console.log('🔗 MongoDB connection will be established...');
}
bootstrap();
