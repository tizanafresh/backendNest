import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, DeviceTokenDto, NotificationResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notificaciones')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva notificación' })
  @ApiResponse({ 
    status: 201, 
    description: 'Notificación creada exitosamente',
    type: NotificationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
  @ApiQuery({ name: 'read', required: false, description: 'Filtrar por estado leído' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de notificación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notificaciones',
    schema: {
      type: 'object',
      properties: {
        notifications: { type: 'array', items: { $ref: '#/components/schemas/NotificationResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  async getNotifications(
    @CurrentUser() user: any,
    @Query() query: any
  ) {
    return this.notificationsService.findAllNotifications(user._id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cantidad de notificaciones no leídas',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' }
      }
    }
  })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user._id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de notificaciones' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas de notificaciones',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        unread: { type: 'number' },
        byType: { type: 'object' }
      }
    }
  })
  async getNotificationStats(@CurrentUser() user: any) {
    return this.notificationsService.getNotificationStats(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una notificación por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación encontrada',
    type: NotificationResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async getNotificationById(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationsService.findNotificationById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una notificación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación actualizada exitosamente',
    type: NotificationResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateNotification(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación marcada como leída',
    type: NotificationResponseDto 
  })
  async markAsRead(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Todas las notificaciones marcadas como leídas',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async deleteNotification(@Param('id') id: string): Promise<void> {
    return this.notificationsService.deleteNotification(id);
  }

  // Device Token Management
  @Post('device-token')
  @ApiOperation({ summary: 'Registrar token de dispositivo' })
  @ApiResponse({ 
    status: 201, 
    description: 'Token de dispositivo registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        token: { type: 'string' },
        platform: { type: 'string' },
        active: { type: 'boolean' }
      }
    }
  })
  async registerDeviceToken(
    @CurrentUser() user: any,
    @Body() deviceTokenDto: DeviceTokenDto
  ) {
    return this.notificationsService.registerDeviceToken({
      ...deviceTokenDto,
      userId: user._id,
    });
  }

  @Get('device-tokens')
  @ApiOperation({ summary: 'Obtener tokens de dispositivos del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tokens de dispositivos',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        token: { type: 'string' },
        platform: { type: 'string' },
        active: { type: 'boolean' }
      }
    }
  })
  async getDeviceTokens(@CurrentUser() user: any) {
    return this.notificationsService.getDeviceTokens(user._id);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Eliminar token de dispositivo' })
  @ApiResponse({ status: 200, description: 'Token de dispositivo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Token de dispositivo no encontrado' })
  async removeDeviceToken(
    @CurrentUser() user: any,
    @Param('token') token: string
  ): Promise<void> {
    return this.notificationsService.removeDeviceToken(user._id, token);
  }

  // Push Notification Endpoints (Admin only)
  @Post('push')
  @ApiOperation({ summary: 'Enviar notificación push a un usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación push enviada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async sendPushNotification(
    @Body() body: { userId: string; title: string; message: string; data?: any }
  ) {
    return this.notificationsService.sendPushNotification(
      body.userId,
      body.title,
      body.message,
      body.data
    );
  }

  @Post('push/bulk')
  @ApiOperation({ summary: 'Enviar notificación push masiva' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificaciones push enviadas',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async sendBulkPushNotification(
    @Body() body: { userIds: string[]; title: string; message: string; data?: any }
  ) {
    return this.notificationsService.sendBulkPushNotification(
      body.userIds,
      body.title,
      body.message,
      body.data
    );
  }
} 