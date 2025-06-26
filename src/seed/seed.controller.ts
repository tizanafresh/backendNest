import { Controller, Post, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    return await this.seedService.seedAll();
  }

  @Get('status')
  async getSeedStatus() {
    return {
      message: 'Endpoint de seeding disponible',
      endpoints: {
        'POST /seed': 'Poblar toda la base de datos con datos de prueba',
        'GET /seed/status': 'Verificar estado del endpoint de seeding',
      },
      note: 'Este endpoint solo debe usarse en desarrollo. En producción, considera usar scripts de migración.',
    };
  }
} 