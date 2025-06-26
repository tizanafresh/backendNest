import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { DeviceToken, DeviceTokenDocument } from '../schemas/device-token.schema';
import { CreateNotificationDto, UpdateNotificationDto, DeviceTokenDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    if (!Types.ObjectId.isValid(createNotificationDto.userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
    });

    return notification.save();
  }

  async findAllNotifications(userId: string, query: any = {}): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const { page = 1, limit = 10, read, type } = query;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    
    if (read !== undefined) {
      filter.read = read === 'true';
    }
    
    if (type) {
      filter.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findNotificationById(id: string): Promise<Notification> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const notification = await this.notificationModel.findById(id).exec();
    
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const notification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
    
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true }
    );

    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async deleteNotification(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const result = await this.notificationModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Notificación no encontrada');
    }
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });

    return { count };
  }

  // Device Token Management
  async registerDeviceToken(deviceTokenDto: DeviceTokenDto): Promise<DeviceToken> {
    if (!Types.ObjectId.isValid(deviceTokenDto.userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar si el token ya existe para este usuario y plataforma
    const existingToken = await this.deviceTokenModel.findOne({
      userId: new Types.ObjectId(deviceTokenDto.userId),
      token: deviceTokenDto.token,
      platform: deviceTokenDto.platform,
    });

    if (existingToken) {
      // Actualizar si ya existe
      existingToken.active = deviceTokenDto.active ?? true;
      return existingToken.save();
    }

    const deviceToken = new this.deviceTokenModel({
      ...deviceTokenDto,
      userId: new Types.ObjectId(deviceTokenDto.userId),
    });

    return deviceToken.save();
  }

  async getDeviceTokens(userId: string): Promise<DeviceToken[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    return this.deviceTokenModel
      .find({ 
        userId: new Types.ObjectId(userId),
        active: true 
      })
      .exec();
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const result = await this.deviceTokenModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      token,
    });

    if (!result) {
      throw new NotFoundException('Token de dispositivo no encontrado');
    }
  }

  // Push Notification Methods (placeholder for Firebase/OneSignal integration)
  async sendPushNotification(userId: string, title: string, message: string, data?: any): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener tokens del usuario
      const deviceTokens = await this.getDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        return { success: false, message: 'No se encontraron tokens de dispositivo para el usuario' };
      }

      // Crear notificación en base de datos
      await this.createNotification({
        userId,
        title,
        message,
        type: 'SYSTEM',
      });

      // TODO: Integrar con Firebase/OneSignal para envío real
      // Por ahora, solo simulamos el envío
      console.log(`Push notification enviada a ${deviceTokens.length} dispositivos:`, {
        title,
        message,
        data,
        tokens: deviceTokens.map(dt => dt.token),
      });

      return { 
        success: true, 
        message: `Notificación enviada a ${deviceTokens.length} dispositivos` 
      };

    } catch (error) {
      console.error('Error enviando push notification:', error);
      return { success: false, message: 'Error enviando notificación' };
    }
  }

  async sendBulkPushNotification(userIds: string[], title: string, message: string, data?: any): Promise<{ success: boolean; message: string }> {
    try {
      let totalSent = 0;
      let totalErrors = 0;

      for (const userId of userIds) {
        try {
          const result = await this.sendPushNotification(userId, title, message, data);
          if (result.success) {
            totalSent++;
          } else {
            totalErrors++;
          }
        } catch (error) {
          totalErrors++;
        }
      }

      return {
        success: totalSent > 0,
        message: `Enviadas: ${totalSent}, Errores: ${totalErrors}`
      };

    } catch (error) {
      console.error('Error enviando bulk push notifications:', error);
      return { success: false, message: 'Error enviando notificaciones masivas' };
    }
  }

  // Automatic notifications for order status changes
  async sendOrderStatusNotification(userId: string, orderId: string, status: string): Promise<void> {
    const statusMessages = {
      'PENDING': 'Tu pedido ha sido recibido y está siendo procesado',
      'CONFIRMED': 'Tu pedido ha sido confirmado y está en preparación',
      'PREPARING': 'Tu pedido está siendo preparado',
      'READY': '¡Tu pedido está listo para recoger!',
      'DELIVERED': 'Tu pedido ha sido entregado. ¡Disfruta!',
      'CANCELLED': 'Tu pedido ha sido cancelado',
    };

    const message = statusMessages[status] || `Tu pedido ha cambiado a estado: ${status}`;

    await this.sendPushNotification(
      userId,
      'Actualización de Pedido',
      message,
      { orderId, status }
    );
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: { [key: string]: number };
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const stats = await this.notificationModel.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: ['$read', 0, 1] }
          },
          byType: {
            $push: '$type'
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byType: [] };
    
    // Contar por tipo
    const byType: { [key: string]: number } = {};
    result.byType.forEach((type: string) => {
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: result.total,
      unread: result.unread,
      byType,
    };
  }
} 