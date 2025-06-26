import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/user.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import {
  RegisterDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponseDto,
} from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Crear un nuevo usuario
   */
  async createUser(registerDto: RegisterDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Generar código QR único
    const qrCode = await this.generateUniqueQRCode();

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Crear el usuario
    const newUser = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      qrCode,
      points: registerDto.points || 0,
      level: registerDto.level || 'BRONZE',
    });

    const savedUser = await newUser.save();
    return this.transformToUserResponse(savedUser);
  }

  /**
   * Obtener todos los usuarios (con paginación)
   */
  async findAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      users: users.map((user) => this.transformToUserResponse(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener usuario por ID
   */
  async findUserById(id: string): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.transformToUserResponse(user);
  }

  /**
   * Obtener usuario por email
   */
  async findUserByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findOne({ email });
    return user ? this.transformToUserResponse(user) : null;
  }

  /**
   * Obtener usuario por código QR
   */
  async findUserByQRCode(qrCode: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findOne({ qrCode });
    return user ? this.transformToUserResponse(user) : null;
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar si el usuario existe
    const existingUser = await this.userModel.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (emailExists) {
        throw new ConflictException(
          'El email ya está registrado por otro usuario',
        );
      }
    }

    // Si se está actualizando la contraseña, encriptarla
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('Error al actualizar el usuario');
    }

    return this.transformToUserResponse(updatedUser);
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que las nuevas contraseñas coincidan
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden');
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Actualizar contraseña
    await this.userModel.findByIdAndUpdate(id, { password: hashedNewPassword });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Agregar puntos al usuario
   */
  async addPoints(id: string, points: number): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    if (points <= 0) {
      throw new BadRequestException('Los puntos deben ser mayores a 0');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $inc: { points } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.transformToUserResponse(user);
  }

  /**
   * Actualizar nivel del usuario basado en puntos
   */
  async updateUserLevel(id: string): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let newLevel = 'BRONZE';
    if (user.points >= 1000) {
      newLevel = 'PLATINUM';
    } else if (user.points >= 500) {
      newLevel = 'GOLD';
    } else if (user.points >= 100) {
      newLevel = 'SILVER';
    }

    if (user.level !== newLevel) {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        { level: newLevel },
        { new: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('Error al actualizar el nivel del usuario');
      }

      return this.transformToUserResponse(updatedUser);
    }

    return this.transformToUserResponse(user);
  }

  /**
   * Agregar producto a favoritos
   */
  async addToFavorites(userId: string, productId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el producto existe
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar si el producto ya está en favoritos
    if (user.favorites.includes(new Types.ObjectId(productId))) {
      throw new BadRequestException('El producto ya está en favoritos');
    }

    // Agregar producto a favoritos
    await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { favorites: productId } },
    );

    return { message: 'Producto agregado a favoritos exitosamente' };
  }

  /**
   * Eliminar producto de favoritos
   */
  async removeFromFavorites(userId: string, productId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el producto existe
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar si el producto está en favoritos
    if (!user.favorites.includes(new Types.ObjectId(productId))) {
      throw new BadRequestException('El producto no está en favoritos');
    }

    // Eliminar producto de favoritos
    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: productId } },
    );

    return { message: 'Producto eliminado de favoritos exitosamente' };
  }

  /**
   * Obtener productos favoritos del usuario
   */
  async getFavorites(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(userId).populate('favorites');
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user.favorites || [];
  }

  /**
   * Verificar si un producto está en favoritos
   */
  async isFavorite(userId: string, productId: string): Promise<{ isFavorite: boolean }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isFavorite = user.favorites.includes(new Types.ObjectId(productId));
    return { isFavorite };
  }

  /**
   * Generar código QR único
   */
  private async generateUniqueQRCode(): Promise<string> {
    let qrCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generar código QR aleatorio
      qrCode = crypto.randomBytes(16).toString('hex').toUpperCase();

      // Verificar que sea único
      const existingUser = await this.userModel.findOne({ qrCode });
      if (!existingUser) {
        isUnique = true;
      }
    }

    return qrCode;
  }

  /**
   * Transformar documento de usuario a DTO de respuesta
   */
  private transformToUserResponse(user: UserDocument): UserResponseDto {
    const userObject = user.toObject();
    return {
      _id: userObject._id?.toString() || '',
      name: userObject.name || '',
      email: userObject.email || '',
      phone: userObject.phone || undefined,
      points: userObject.points || 0,
      level: userObject.level || 'BRONZE',
      qrCode: userObject.qrCode || '',
      favorites: userObject.favorites?.map(fav => fav.toString()) || [],
      createdAt: userObject.createdAt || undefined,
      updatedAt: userObject.updatedAt || undefined,
    } as UserResponseDto;
  }
}
