import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto';
import * as QRCode from 'qrcode';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    // Verificar si el código ya existe
    const existingCoupon = await this.couponModel.findOne({ 
      code: createCouponDto.code.toUpperCase() 
    });
    
    if (existingCoupon) {
      throw new ConflictException('El código del cupón ya existe');
    }

    // Generar QR code si no se proporciona
    let qrCode = createCouponDto.qrCode;
    if (!qrCode) {
      qrCode = await this.generateQRCode(createCouponDto.code);
    }

    const coupon = new this.couponModel({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
      qrCode,
    });

    return coupon.save();
  }

  async findAll(query: any = {}): Promise<Coupon[]> {
    const { page = 1, limit = 10, active, type } = query;
    
    const filter: any = {};
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;
    
    return this.couponModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();
  }

  async findOne(id: string): Promise<Coupon> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cupón inválido');
    }

    const coupon = await this.couponModel.findById(id).exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponModel.findOne({ 
      code: code.toUpperCase() 
    }).exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cupón inválido');
    }

    // Si se está actualizando el código, verificar que no exista
    if (updateCouponDto.code) {
      const existingCoupon = await this.couponModel.findOne({ 
        code: updateCouponDto.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (existingCoupon) {
        throw new ConflictException('El código del cupón ya existe');
      }
      
      updateCouponDto.code = updateCouponDto.code.toUpperCase();
    }

    const coupon = await this.couponModel
      .findByIdAndUpdate(id, updateCouponDto, { new: true })
      .exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return coupon;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cupón inválido');
    }

    const result = await this.couponModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Cupón no encontrado');
    }
  }

  async validateCoupon(validateCouponDto: ValidateCouponDto): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    message?: string;
  }> {
    try {
      const coupon = await this.findByCode(validateCouponDto.code);
      
      // Verificar si está activo
      if (!coupon.active) {
        return {
          valid: false,
          message: 'El cupón no está activo'
        };
      }

      // Verificar si ha expirado
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return {
          valid: false,
          message: 'El cupón ha expirado'
        };
      }

      // Verificar límite de usos
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return {
          valid: false,
          message: 'El cupón ha alcanzado su límite de usos'
        };
      }

      // Verificar si es específico para un usuario
      if (coupon.userId && validateCouponDto.userId) {
        if (coupon.userId.toString() !== validateCouponDto.userId) {
          return {
            valid: false,
            message: 'Este cupón no es válido para este usuario'
          };
        }
      }

      // Verificar monto mínimo
      if (coupon.minAmount && validateCouponDto.orderAmount) {
        if (validateCouponDto.orderAmount < coupon.minAmount) {
          return {
            valid: false,
            message: `El monto mínimo para usar este cupón es $${coupon.minAmount}`
          };
        }
      }

      // Calcular descuento
      let discount = 0;
      if (validateCouponDto.orderAmount) {
        if (coupon.type === 'PERCENTAGE') {
          discount = (validateCouponDto.orderAmount * coupon.discount) / 100;
        } else {
          discount = coupon.discount;
        }
      }

      return {
        valid: true,
        coupon,
        discount
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Cupón no válido'
      };
    }
  }

  async useCoupon(code: string): Promise<Coupon> {
    const coupon = await this.findByCode(code);
    
    // Incrementar contador de usos
    coupon.usedCount += 1;
    
    return coupon.save();
  }

  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      throw new BadRequestException('Error al generar el código QR');
    }
  }

  async getCouponStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUses: number;
  }> {
    const stats = await this.couponModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$active', 1, 0] }
          },
          expired: {
            $sum: {
              $cond: [
                { $and: ['$expiresAt', { $lt: ['$expiresAt', new Date()] }] },
                1,
                0
              ]
            }
          },
          totalUses: { $sum: '$usedCount' }
        }
      }
    ]);

    return stats[0] || { total: 0, active: 0, expired: 0, totalUses: 0 };
  }
} 