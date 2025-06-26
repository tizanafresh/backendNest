import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // Configuración de variables de entorno (debe ir primero)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Configuración de MongoDB con Mongoose usando ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('🔗 MongoDB URI loaded:', uri ? '✅ Success' : '❌ Not found');
        return {
          uri: uri || 'mongodb://localhost:27017/tizanafresh',
        };
      },
      inject: [ConfigService],
    }),
    // Módulo de autenticación
    AuthModule,
    // Módulo de seeding (solo para desarrollo)
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
