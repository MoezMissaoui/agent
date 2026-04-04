import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

type GoogleUser = { identifier: string; email: string };

@ApiTags('auth')
@ApiSecurity('api-key')
@Controller('auth')
export class GoogleOAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirection vers Google OAuth' })
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Callback Google OAuth — redirection vers le front avec JWT dans le fragment' })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const u = req.user as GoogleUser;
    const tokens = await this.auth.oauthTokens(u.identifier, u.email);
    const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:8548').replace(/\/$/, '');
    const hash = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }).toString();
    res.redirect(`${base}/auth/google/callback#${hash}`);
  }
}
