import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from './user.service';
import {
  RegisterDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponseDto,
} from './dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Registrar un nuevo usuario
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.userService.createUser(registerDto);
  }

  /**
   * Obtener todos los usuarios con paginación
   */
  @Get()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.userService.findAllUsers(page, limit);
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findUserById(id);
  }

  /**
   * Obtener usuario por código QR
   */
  @Get('qr/:qrCode')
  async getUserByQRCode(
    @Param('qrCode') qrCode: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findUserByQRCode(qrCode);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  @Get('profile/me')
  async getMyProfile(
    @Request() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    return this.userService.findUserById(req.user.sub);
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  @Put('profile/me')
  async updateMyProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(req.user.sub, updateUserDto);
  }

  /**
   * Cambiar contraseña del usuario autenticado
   */
  @Put('profile/change-password')
  async changeMyPassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.userService.changePassword(req.user.sub, changePasswordDto);
  }

  /**
   * Actualizar usuario por ID (admin)
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  /**
   * Eliminar usuario por ID (admin)
   */
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    return this.userService.deleteUser(id);
  }

  /**
   * Agregar puntos a un usuario
   */
  @Put(':id/points')
  async addPoints(
    @Param('id') id: string,
    @Body() body: { points: number },
  ): Promise<UserResponseDto> {
    return this.userService.addPoints(id, body.points);
  }

  /**
   * Actualizar nivel del usuario basado en puntos
   */
  @Put(':id/level')
  async updateUserLevel(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.updateUserLevel(id);
  }

  /**
   * Agregar producto a favoritos
   */
  @Post('favorites/:productId')
  async addToFavorites(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ message: string }> {
    return this.userService.addToFavorites(req.user.sub, productId);
  }

  /**
   * Eliminar producto de favoritos
   */
  @Delete('favorites/:productId')
  async removeFromFavorites(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ message: string }> {
    return this.userService.removeFromFavorites(req.user.sub, productId);
  }

  /**
   * Obtener productos favoritos del usuario
   */
  @Get('favorites')
  async getFavorites(@Request() req: RequestWithUser): Promise<any[]> {
    return this.userService.getFavorites(req.user.sub);
  }

  /**
   * Verificar si un producto está en favoritos
   */
  @Get('favorites/:productId/check')
  async checkFavorite(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ isFavorite: boolean }> {
    return this.userService.isFavorite(req.user.sub, productId);
  }
}
