import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { Profile } from 'passport-google-oauth20';
import { Repository } from 'typeorm';
import { AuthTokenType } from '../database/enums/auth-token-type.enum';
import { UserAuthToken } from '../database/entities/user-auth-token.entity';
import { User } from '../database/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService, shouldUseSmtpMail } from './mail/mail.service';
import { ResendVerificationDto } from './dto/resend-verification.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserAuthToken)
    private readonly authTokens: Repository<UserAuthToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const username = dto.username.trim().toLowerCase();
    const existingEmail = await this.users.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }
    const existingUsername = await this.users.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }
    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.users.create({
      email,
      username,
      password: hash,
    });
    await this.users.save(user);
    await this.issueEmailVerification(user);
    return {
      message: 'Check your email to verify your account before signing in.',
      email: user.email,
      requiresEmailVerification: true as const,
    };
  }

  async getMe(identifier: string) {
    const user = await this.users.findOne({ where: { identifier } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: user.identifier,
      email: user.email,
      username: user.username,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException(
        user && !user.password
          ? 'This account uses Google sign-in.'
          : 'Invalid credentials',
      );
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in.',
        statusCode: 403,
      });
    }
    const remember = Boolean(dto.rememberMe);
    return this.issueTokenPair(user.identifier, user.email, remember);
  }

  async refresh(dto: RefreshDto) {
    try {
      const secret = this.config.get<string>('JWT_SECRET', '');
      const payload = this.jwt.verify<{
        sub: string;
        email: string;
        typ?: string;
        remember?: boolean;
      }>(dto.refreshToken, { secret });
      if (payload.typ !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await this.users.findOne({ where: { identifier: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (user.password && !user.emailVerifiedAt) {
        throw new ForbiddenException({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before signing in.',
          statusCode: 403,
        });
      }
      const remember = Boolean(payload.remember);
      return this.issueTokenPair(user.identifier, user.email, remember);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException('No account is registered with this email address.');
    }
    const generic = {
      message: 'A reset link has been sent to your email.',
    };
    const ttl = parseInt(
      this.config.get<string>('PASSWORD_RESET_TTL_MINUTES', '60'),
      10,
    );
    const rawToken = await this.createAuthToken(
      user.id,
      AuthTokenType.PASSWORD_RESET,
      ttl,
    );
    const base = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:8548')
      .replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?token=${rawToken}`;
    await this.mail.sendPasswordResetLink(user.email, resetUrl);
    const smtpConfigured = shouldUseSmtpMail(this.config);
    return {
      ...generic,
      ...(smtpConfigured
        ? { mailDelivery: 'email' as const }
        : { mailDelivery: 'dev_log' as const }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const row = await this.authTokens.findOne({
      where: {
        tokenHash,
        type: AuthTokenType.PASSWORD_RESET,
      },
      relations: ['user'],
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const user = row.user;
    user.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.users.save(user);
    await this.authTokens.delete({ id: row.id });
    return { message: 'Password has been reset. You can sign in.' };
  }

  /** Après OAuth Google — même JWT que login / register. */
  async oauthTokens(identifier: string, email: string) {
    return this.issueTokenPair(identifier, email, false);
  }

  async validateGoogleProfile(profile: Profile) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }
    let user = await this.users.findOne({ where: { googleId } });
    if (user) {
      return { identifier: user.identifier, email: user.email };
    }
    user = await this.users.findOne({ where: { email } });
    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new ConflictException('This email is linked to another Google account');
      }
      user.googleId = googleId;
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
      }
      await this.users.save(user);
      return { identifier: user.identifier, email: user.email };
    }
    const username = await this.generateUniqueUsernameFromEmail(email);
    const created = this.users.create({
      email,
      username,
      password: null,
      googleId,
      emailVerifiedAt: new Date(),
    });
    await this.users.save(created);
    return { identifier: created.identifier, email: created.email };
  }

  private async generateUniqueUsernameFromEmail(email: string): Promise<string> {
    const local = email.split('@')[0] ?? 'user';
    let base = local.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 32);
    if (base.length < 3) {
      base = `${base}usr`.slice(0, 32);
    }
    if (!base) {
      base = 'user';
    }
    let candidate = base;
    for (let n = 0; n < 30; n++) {
      const exists = await this.users.findOne({ where: { username: candidate } });
      if (!exists) {
        return candidate;
      }
      const suffix = randomBytes(3).toString('hex');
      candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`.slice(0, 32);
    }
    throw new ConflictException('Could not allocate username');
  }

  async verifyEmailFromToken(rawToken: string): Promise<void> {
    const trimmed = rawToken?.trim();
    if (!trimmed) {
      throw new BadRequestException('Missing verification token');
    }
    const tokenHash = createHash('sha256').update(trimmed).digest('hex');
    const row = await this.authTokens.findOne({
      where: {
        tokenHash,
        type: AuthTokenType.EMAIL_VERIFICATION,
      },
      relations: ['user'],
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link');
    }
    const user = row.user;
    user.emailVerifiedAt = new Date();
    await this.users.save(user);
    await this.authTokens.delete({ id: row.id });
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    const generic = {
      message:
        'If an account exists and needs verification, a new link has been sent.',
    };
    const smtpConfigured = shouldUseSmtpMail(this.config);
    if (!user?.password || user.emailVerifiedAt) {
      return {
        ...generic,
        mailDelivery: smtpConfigured ? ('email' as const) : ('dev_log' as const),
      };
    }
    await this.issueEmailVerification(user);
    return {
      ...generic,
      mailDelivery: smtpConfigured ? ('email' as const) : ('dev_log' as const),
    };
  }

  private async issueEmailVerification(user: User): Promise<void> {
    const ttl = parseInt(
      this.config.get<string>('EMAIL_VERIFICATION_TTL_MINUTES', '1440'),
      10,
    );
    const rawToken = await this.createAuthToken(
      user.id,
      AuthTokenType.EMAIL_VERIFICATION,
      ttl,
    );
    const base = this.config
      .get<string>('BACKEND_PUBLIC_URL', 'http://localhost:8547')
      .replace(/\/$/, '');
    const verifyUrl = `${base}/api/v1.0/auth/verify-email?token=${rawToken}`;
    await this.mail.sendEmailVerificationLink(user.email, verifyUrl);
  }

  /** Remplace tout jeton existant du même type pour cet utilisateur ; retourne le token brut (secret). */
  private async createAuthToken(
    userId: number,
    type: AuthTokenType,
    ttlMinutes: number,
  ): Promise<string> {
    await this.authTokens.delete({ userId, type });
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.authTokens.save(
      this.authTokens.create({
        userId,
        tokenHash,
        expiresAt,
        type,
      }),
    );
    return rawToken;
  }

  private issueTokenPair(userId: string, email: string, remember: boolean) {
    const accessExp = remember
      ? this.config.get<string>('JWT_ACCESS_REMEMBER_EXPIRES_IN', '7d')
      : this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '1d');
    const refreshExp = remember
      ? this.config.get<string>('JWT_REFRESH_REMEMBER_EXPIRES_IN', '30d')
      : this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const accessToken = this.jwt.sign({ sub: userId, email, typ: 'access' }, {
      expiresIn: accessExp,
    } as Record<string, unknown>);
    const refreshToken = this.jwt.sign(
      { sub: userId, email, typ: 'refresh', remember },
      { expiresIn: refreshExp } as Record<string, unknown>,
    );
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: accessExp,
    };
  }
}
