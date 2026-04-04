import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Confirmer l’e-mail (lien reçu par mail)' })
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const base = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:8548')
      .replace(/\/$/, '');
    try {
      await this.auth.verifyEmailFromToken(token);
      res.redirect(`${base}/login?verified=1`);
    } catch {
      res.redirect(`${base}/login?error=verify_failed`);
    }
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Renvoyer le lien de vérification (compte non vérifié)' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto);
  }

  /** Profil (JWT access requis). */
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Profil utilisateur connecté' })
  me(@Req() req: AuthedRequest) {
    return this.auth.getMe(req.user.userId);
  }
}
