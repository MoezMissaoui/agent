import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService, shouldUseSmtpMail } from './mail/mail.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.users.create({
      email: dto.email.toLowerCase(),
      password: hash,
    });
    await this.users.save(user);
    return this.issueTokenPair(user.identifier, user.email, false);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
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
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const ttl = parseInt(
      this.config.get<string>('PASSWORD_RESET_TTL_MINUTES', '60'),
      10,
    );
    const expires = new Date(Date.now() + ttl * 60 * 1000);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires = expires;
    await this.users.save(user);
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
    const user = await this.users.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    user.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await this.users.save(user);
    return { message: 'Password has been reset. You can sign in.' };
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
