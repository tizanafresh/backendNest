import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { UserService } from './user.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto, UserResponseDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.userService.createUser(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.login(user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login-local')
  async loginWithGuard(
    @Request() req: RequestWithUser,
  ): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any): UserResponseDto {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verifyToken(@CurrentUser() user: any): {
    message: string;
    user: UserResponseDto;
  } {
    return {
      message: 'Token válido',
      user: user,
    };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('user-agent') userAgent: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const ipAddress = forwardedFor || req.ip || req.connection.remoteAddress;
    return this.authService.forgotPassword(forgotPasswordDto, ipAddress, userAgent);
  }

  /**
   * Resetear contraseña con token
   */
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('user-agent') userAgent: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const ipAddress = forwardedFor || req.ip || req.connection.remoteAddress;
    return this.authService.resetPassword(resetPasswordDto, ipAddress, userAgent);
  }

  /**
   * Verificar si un token de recuperación es válido
   */
  @Get('verify-reset-token/:token')
  async verifyResetToken(@Request() req: any): Promise<{ valid: boolean; email?: string }> {
    const token = req.params.token;
    return this.authService.verifyResetToken(token);
  }
}
