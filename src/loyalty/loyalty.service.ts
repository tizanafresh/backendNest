import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoyaltyHistory, LoyaltyHistoryDocument } from '../schemas/loyalty-history.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import {
  CreateLoyaltyDto,
  LoyaltyResponseDto,
  LoyaltyType,
  LevelBenefitsDto,
  UserBenefitsDto,
  BenefitDto,
} from './dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel(LoyaltyHistory.name) private loyaltyHistoryModel: Model<LoyaltyHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Crear un registro de fidelización
   */
  async createLoyaltyRecord(createLoyaltyDto: CreateLoyaltyDto): Promise<LoyaltyResponseDto> {
    if (!Types.ObjectId.isValid(createLoyaltyDto.userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar que el usuario existe
    const user = await this.userModel.findById(createLoyaltyDto.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si hay un orderId, verificar que el pedido existe
    if (createLoyaltyDto.orderId) {
      if (!Types.ObjectId.isValid(createLoyaltyDto.orderId)) {
        throw new BadRequestException('ID de pedido inválido');
      }

      const order = await this.orderModel.findById(createLoyaltyDto.orderId);
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
    }

    // Crear el registro de fidelización
    const newLoyaltyRecord = new this.loyaltyHistoryModel({
      userId: new Types.ObjectId(createLoyaltyDto.userId),
      type: createLoyaltyDto.type,
      points: createLoyaltyDto.points,
      description: createLoyaltyDto.description,
      orderId: createLoyaltyDto.orderId ? new Types.ObjectId(createLoyaltyDto.orderId) : undefined,
    });

    const savedRecord = await newLoyaltyRecord.save();

    // Actualizar puntos del usuario
    await this.updateUserPoints(createLoyaltyDto.userId, createLoyaltyDto.points, createLoyaltyDto.type);

    return this.transformToLoyaltyResponse(savedRecord);
  }

  /**
   * Obtener historial de fidelización de un usuario
   */
  async getUserLoyaltyHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    records: LoyaltyResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.loyaltyHistoryModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('orderId', 'total finalTotal status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.loyaltyHistoryModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
    ]);

    return {
      records: records.map(record => this.transformToLoyaltyResponse(record)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener estadísticas de fidelización de un usuario
   */
  async getUserLoyaltyStats(userId: string): Promise<{
    totalPoints: number;
    earnedPoints: number;
    spentPoints: number;
    bonusPoints: number;
    promotionPoints: number;
    currentLevel: string;
    nextLevel: string;
    pointsToNextLevel: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const stats = await this.loyaltyHistoryModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          earnedPoints: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'EARNED'] },
                '$points',
                0
              ]
            }
          },
          spentPoints: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'SPENT'] },
                '$points',
                0
              ]
            }
          },
          bonusPoints: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'BONUS'] },
                '$points',
                0
              ]
            }
          },
          promotionPoints: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'PROMOTION'] },
                '$points',
                0
              ]
            }
          },
        }
      }
    ]);

    const result = stats[0] || {
      totalPoints: 0,
      earnedPoints: 0,
      spentPoints: 0,
      bonusPoints: 0,
      promotionPoints: 0,
    };

    // Calcular nivel actual y siguiente
    const currentLevel = user.level;
    let nextLevel = 'PLATINUM';
    let pointsToNextLevel = 0;

    if (currentLevel === 'BRONZE') {
      nextLevel = 'SILVER';
      pointsToNextLevel = 100 - user.points;
    } else if (currentLevel === 'SILVER') {
      nextLevel = 'GOLD';
      pointsToNextLevel = 500 - user.points;
    } else if (currentLevel === 'GOLD') {
      nextLevel = 'PLATINUM';
      pointsToNextLevel = 1000 - user.points;
    } else {
      pointsToNextLevel = 0;
    }

    return {
      totalPoints: result.totalPoints,
      earnedPoints: result.earnedPoints,
      spentPoints: result.spentPoints,
      bonusPoints: result.bonusPoints,
      promotionPoints: result.promotionPoints,
      currentLevel,
      nextLevel,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
    };
  }

  /**
   * Agregar puntos automáticamente por compra
   */
  async addPointsForPurchase(userId: string, orderId: string, orderTotal: number): Promise<LoyaltyResponseDto> {
    // Calcular puntos basados en el total de la compra (1 punto por cada $1)
    const pointsEarned = Math.floor(orderTotal);

    const createLoyaltyDto: CreateLoyaltyDto = {
      userId,
      type: LoyaltyType.EARNED,
      points: pointsEarned,
      description: `Puntos ganados por compra de $${orderTotal}`,
      orderId,
    };

    return this.createLoyaltyRecord(createLoyaltyDto);
  }

  /**
   * Canjear puntos por descuento
   */
  async redeemPoints(userId: string, pointsToRedeem: number, orderId?: string): Promise<LoyaltyResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (pointsToRedeem <= 0) {
      throw new BadRequestException('Los puntos a canjear deben ser mayores a 0');
    }

    if (user.points < pointsToRedeem) {
      throw new BadRequestException('Puntos insuficientes para canjear');
    }

    const createLoyaltyDto: CreateLoyaltyDto = {
      userId,
      type: LoyaltyType.SPENT,
      points: pointsToRedeem,
      description: `Puntos canjeados: ${pointsToRedeem} puntos`,
      orderId,
    };

    return this.createLoyaltyRecord(createLoyaltyDto);
  }

  /**
   * Agregar puntos de bonificación
   */
  async addBonusPoints(userId: string, points: number, description: string, orderId?: string): Promise<LoyaltyResponseDto> {
    const createLoyaltyDto: CreateLoyaltyDto = {
      userId,
      type: LoyaltyType.BONUS,
      points,
      description,
      orderId,
    };

    return this.createLoyaltyRecord(createLoyaltyDto);
  }

  /**
   * Agregar puntos de promoción
   */
  async addPromotionPoints(userId: string, points: number, description: string, orderId?: string): Promise<LoyaltyResponseDto> {
    const createLoyaltyDto: CreateLoyaltyDto = {
      userId,
      type: LoyaltyType.PROMOTION,
      points,
      description,
      orderId,
    };

    return this.createLoyaltyRecord(createLoyaltyDto);
  }

  /**
   * Obtener todos los registros de fidelización (admin)
   */
  async getAllLoyaltyRecords(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    records: LoyaltyResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.loyaltyHistoryModel
        .find()
        .populate('userId', 'name email')
        .populate('orderId', 'total finalTotal status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.loyaltyHistoryModel.countDocuments().exec(),
    ]);

    return {
      records: records.map(record => this.transformToLoyaltyResponse(record)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar puntos del usuario
   */
  private async updateUserPoints(userId: string, points: number, type: LoyaltyType): Promise<void> {
    let pointsToAdd = 0;

    if (type === LoyaltyType.EARNED || type === LoyaltyType.BONUS || type === LoyaltyType.PROMOTION) {
      pointsToAdd = points;
    } else if (type === LoyaltyType.SPENT) {
      pointsToAdd = -points;
    }

    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { points: pointsToAdd } },
      { new: true }
    );

    // Actualizar nivel del usuario si es necesario
    await this.updateUserLevel(userId);
  }

  /**
   * Actualizar nivel del usuario basado en puntos
   */
  private async updateUserLevel(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    let newLevel = 'BRONZE';
    if (user.points >= 1000) {
      newLevel = 'PLATINUM';
    } else if (user.points >= 500) {
      newLevel = 'GOLD';
    } else if (user.points >= 100) {
      newLevel = 'SILVER';
    }

    if (user.level !== newLevel) {
      await this.userModel.findByIdAndUpdate(userId, { level: newLevel });
    }
  }

  /**
   * Transformar documento de fidelización a DTO de respuesta
   */
  private transformToLoyaltyResponse(record: LoyaltyHistoryDocument): LoyaltyResponseDto {
    const recordObject = record.toObject();
    return {
      _id: recordObject._id?.toString() || '',
      userId: recordObject.userId?.toString() || '',
      type: recordObject.type || 'EARNED',
      points: recordObject.points || 0,
      description: recordObject.description || '',
      orderId: recordObject.orderId?.toString() || undefined,
      createdAt: recordObject.createdAt || undefined,
      updatedAt: recordObject.updatedAt || undefined,
    } as LoyaltyResponseDto;
  }

  /**
   * Obtener beneficios disponibles por nivel
   */
  getLevelBenefits(): {
    BRONZE: LevelBenefitsDto;
    SILVER: LevelBenefitsDto;
    GOLD: LevelBenefitsDto;
    PLATINUM: LevelBenefitsDto;
  } {
    return {
      BRONZE: {
        level: 'BRONZE',
        pointsRequired: 0,
        description: 'Nivel inicial - Acceso básico a beneficios',
        benefits: [
          {
            name: 'Descuento Básico',
            description: '5% de descuento en productos seleccionados',
            discountPercentage: 5,
            minPointsRequired: 0,
          },
          {
            name: 'Cumpleaños',
            description: '10% de descuento en tu cumpleaños',
            discountPercentage: 10,
            minPointsRequired: 0,
            code: 'BIRTHDAY',
          },
        ],
      },
      SILVER: {
        level: 'SILVER',
        pointsRequired: 100,
        description: 'Nivel plata - Beneficios mejorados',
        benefits: [
          {
            name: 'Descuento Plata',
            description: '10% de descuento en todos los productos',
            discountPercentage: 10,
            minPointsRequired: 0,
          },
          {
            name: 'Envío Gratis',
            description: 'Envío gratis en pedidos superiores a $50',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'FREESHIP',
          },
          {
            name: 'Cumpleaños Mejorado',
            description: '15% de descuento en tu cumpleaños',
            discountPercentage: 15,
            minPointsRequired: 0,
            code: 'BIRTHDAY_SILVER',
          },
        ],
      },
      GOLD: {
        level: 'GOLD',
        pointsRequired: 500,
        description: 'Nivel oro - Beneficios premium',
        benefits: [
          {
            name: 'Descuento Oro',
            description: '15% de descuento en todos los productos',
            discountPercentage: 15,
            minPointsRequired: 0,
          },
          {
            name: 'Envío Gratis Premium',
            description: 'Envío gratis en todos los pedidos',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'FREESHIP_GOLD',
          },
          {
            name: 'Productos Exclusivos',
            description: 'Acceso a productos exclusivos y edición limitada',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'EXCLUSIVE',
          },
          {
            name: 'Cumpleaños Premium',
            description: '20% de descuento en tu cumpleaños',
            discountPercentage: 20,
            minPointsRequired: 0,
            code: 'BIRTHDAY_GOLD',
          },
        ],
      },
      PLATINUM: {
        level: 'PLATINUM',
        pointsRequired: 1000,
        description: 'Nivel platino - Máximos beneficios',
        benefits: [
          {
            name: 'Descuento Platino',
            description: '20% de descuento en todos los productos',
            discountPercentage: 20,
            minPointsRequired: 0,
          },
          {
            name: 'Envío Gratis VIP',
            description: 'Envío gratis prioritario en todos los pedidos',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'FREESHIP_VIP',
          },
          {
            name: 'Productos Exclusivos VIP',
            description: 'Acceso prioritario a productos exclusivos',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'EXCLUSIVE_VIP',
          },
          {
            name: 'Cumpleaños VIP',
            description: '25% de descuento en tu cumpleaños',
            discountPercentage: 25,
            minPointsRequired: 0,
            code: 'BIRTHDAY_PLATINUM',
          },
          {
            name: 'Soporte VIP',
            description: 'Soporte prioritario 24/7',
            discountPercentage: 0,
            minPointsRequired: 0,
            code: 'VIP_SUPPORT',
          },
        ],
      },
    };
  }

  /**
   * Obtener beneficios disponibles para un usuario
   */
  async getUserBenefits(userId: string): Promise<UserBenefitsDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const levelBenefits = this.getLevelBenefits();
    const currentLevel = user.level as keyof typeof levelBenefits;
    const currentBenefits = levelBenefits[currentLevel];

    // Determinar el siguiente nivel
    let nextLevel: keyof typeof levelBenefits = 'PLATINUM';
    let pointsToNextLevel = 0;

    if (currentLevel === 'BRONZE') {
      nextLevel = 'SILVER';
      pointsToNextLevel = 100 - user.points;
    } else if (currentLevel === 'SILVER') {
      nextLevel = 'GOLD';
      pointsToNextLevel = 500 - user.points;
    } else if (currentLevel === 'GOLD') {
      nextLevel = 'PLATINUM';
      pointsToNextLevel = 1000 - user.points;
    } else {
      pointsToNextLevel = 0;
    }

    const nextLevelBenefits = levelBenefits[nextLevel];

    return {
      userId: (user._id as Types.ObjectId).toString(),
      currentLevel: user.level,
      availableBenefits: currentBenefits.benefits,
      nextLevelBenefits: nextLevelBenefits.benefits,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
    };
  }

  /**
   * Aplicar descuento por nivel de fidelización
   */
  async applyLevelDiscount(userId: string, orderTotal: number): Promise<{
    discount: number;
    discountPercentage: number;
    finalTotal: number;
    appliedBenefit: string;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const levelBenefits = this.getLevelBenefits();
    const currentLevel = user.level as keyof typeof levelBenefits;
    const currentBenefits = levelBenefits[currentLevel];

    // Buscar el beneficio de descuento principal del nivel
    const discountBenefit = currentBenefits.benefits.find(
      benefit => benefit.name.toLowerCase().includes('descuento')
    );

    if (!discountBenefit) {
      return {
        discount: 0,
        discountPercentage: 0,
        finalTotal: orderTotal,
        appliedBenefit: 'Sin descuento aplicable',
      };
    }

    const discount = (orderTotal * discountBenefit.discountPercentage) / 100;
    const finalTotal = orderTotal - discount;

    return {
      discount,
      discountPercentage: discountBenefit.discountPercentage,
      finalTotal,
      appliedBenefit: discountBenefit.name,
    };
  }

  /**
   * Verificar si un código de beneficio es válido para un usuario
   */
  async validateBenefitCode(userId: string, code: string): Promise<{
    isValid: boolean;
    benefit?: BenefitDto;
    message: string;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const levelBenefits = this.getLevelBenefits();
    const currentLevel = user.level as keyof typeof levelBenefits;
    const currentBenefits = levelBenefits[currentLevel];

    const benefit = currentBenefits.benefits.find(b => b.code === code);

    if (!benefit) {
      return {
        isValid: false,
        message: 'Código de beneficio no válido para tu nivel',
      };
    }

    return {
      isValid: true,
      benefit,
      message: `Beneficio válido: ${benefit.name}`,
    };
  }
} 