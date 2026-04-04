import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { UserAuthToken } from '../database/entities/user-auth-token.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MailService, createMailService } from './mail/mail.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

const googleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL,
);

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([User, UserAuthToken]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
          }),
        }),
      ],
      controllers: [
        AuthController,
        ...(googleOAuthEnabled ? [GoogleOAuthController] : []),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        ...(googleOAuthEnabled ? [GoogleStrategy] : []),
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        {
          provide: MailService,
          useFactory: (config: ConfigService) => createMailService(config),
          inject: [ConfigService],
        },
      ],
      exports: [AuthService],
    };
  }
}
