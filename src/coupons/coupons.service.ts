import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponResponseDto } from './dto';
import * as QRCode from 'qrcode';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    // Verificar si el código ya existe
    const existingCoupon = await this.couponModel.findOne({ 
      code: createCouponDto.code.toUpperCase() 
    });
    
    if (existingCoupon) {
      throw new ConflictException('El código del cupón ya existe');
    }

    // Generar QR code
    const qrCode = await this.generateQRCode(createCouponDto.code);

    const coupon = new this.couponModel({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
      qrCode,
      currentUses: 0,
      isActive: createCouponDto.isActive ?? true,
    });

    const savedCoupon = await coupon.save();
    return this.transformToCouponResponse(savedCoupon);
  }

  async findAll(query: any = {}): Promise<{
    coupons: CouponResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, active, type } = query;
    
    const filter: any = {};
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    if (type) {
      filter.discountType = type;
    }

    const skip = (page - 1) * limit;
    
    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec(),
      this.couponModel.countDocuments(filter).exec(),
    ]);

    return {
      coupons: coupons.map(coupon => this.transformToCouponResponse(coupon)),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  async findActive(): Promise<CouponResponseDto[]> {
    const coupons = await this.couponModel
      .find({ 
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return coupons.map(coupon => this.transformToCouponResponse(coupon));
  }

  async findByCategory(category: string): Promise<CouponResponseDto[]> {
    const coupons = await this.couponModel
      .find({ category, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    
    return coupons.map(coupon => this.transformToCouponResponse(coupon));
  }

  async findByType(type: string): Promise<CouponResponseDto[]> {
    const coupons = await this.couponModel
      .find({ discountType: type, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    
    return coupons.map(coupon => this.transformToCouponResponse(coupon));
  }

  async findOne(id: string): Promise<CouponResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cupón inválido');
    }

    const coupon = await this.couponModel.findById(id).exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return this.transformToCouponResponse(coupon);
  }

  async findByCode(code: string): Promise<CouponResponseDto> {
    const coupon = await this.couponModel.findOne({ 
      code: code.toUpperCase() 
    }).exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return this.transformToCouponResponse(coupon);
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<CouponResponseDto> {
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

    return this.transformToCouponResponse(coupon);
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cupón inválido');
    }

    const result = await this.couponModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return { message: 'Cupón eliminado exitosamente' };
  }

  async validateCoupon(validateCouponDto: ValidateCouponDto): Promise<{
    isValid: boolean;
    coupon?: CouponResponseDto;
    message: string;
    discount?: number;
  }> {
    try {
      const coupon = await this.findByCode(validateCouponDto.code);
      
      // Verificar si está activo
      if (!coupon.isActive) {
        return {
          isValid: false,
          message: 'El cupón no está activo'
        };
      }

      // Verificar si ha expirado
      if (coupon.validTo && new Date() > new Date(coupon.validTo)) {
        return {
          isValid: false,
          message: 'El cupón ha expirado'
        };
      }

      // Verificar límite de usos
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return {
          isValid: false,
          message: 'El cupón ha alcanzado su límite de usos'
        };
      }

      // Verificar monto mínimo
      if (coupon.minOrderAmount && validateCouponDto.orderAmount) {
        if (validateCouponDto.orderAmount < coupon.minOrderAmount) {
          return {
            isValid: false,
            message: `El monto mínimo para usar este cupón es $${coupon.minOrderAmount}`
          };
        }
      }

      // Calcular descuento
      let discount = 0;
      if (validateCouponDto.orderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (validateCouponDto.orderAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else {
          discount = coupon.discountValue;
        }
      }

      return {
        isValid: true,
        coupon,
        discount,
        message: 'Cupón válido'
      };

    } catch (error) {
      return {
        isValid: false,
        message: 'Cupón no encontrado'
      };
    }
  }

  async useCoupon(code: string): Promise<CouponResponseDto> {
    const coupon = await this.couponModel.findOne({ 
      code: code.toUpperCase() 
    }).exec();
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    coupon.currentUses += 1;
    const updatedCoupon = await coupon.save();
    
    return this.transformToCouponResponse(updatedCoupon);
  }

  async generateQR(id: string): Promise<{ qrCode: string }> {
    const coupon = await this.findOne(id);
    const qrCode = await this.generateQRCode(coupon.code);
    return { qrCode };
  }

  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      throw new BadRequestException('Error al generar el código QR');
    }
  }

  private transformToCouponResponse(coupon: CouponDocument): CouponResponseDto {
    const couponObject = coupon.toObject();
    return {
      _id: couponObject._id?.toString() || '',
      code: couponObject.code || '',
      description: couponObject.description || '',
      discountType: couponObject.discountType || 'PERCENTAGE',
      discountValue: couponObject.discountValue || 0,
      minOrderAmount: couponObject.minOrderAmount,
      maxDiscount: couponObject.maxDiscount,
      validFrom: couponObject.validFrom,
      validTo: couponObject.validTo,
      maxUses: couponObject.maxUses,
      currentUses: couponObject.currentUses || 0,
      isActive: couponObject.isActive ?? true,
      category: couponObject.category,
      qrCode: couponObject.qrCode,
      createdAt: couponObject.createdAt,
      updatedAt: couponObject.updatedAt,
    };
  }
} 