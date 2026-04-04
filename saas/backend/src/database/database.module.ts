import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { ApiKey } from './entities/api-key.entity';
import { ChatSession } from './entities/chat-session.entity';
import { Document } from './entities/document.entity';
import { Message } from './entities/message.entity';
import { User } from './entities/user.entity';
import { UserAuthToken } from './entities/user-auth-token.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(String(config.get('DB_PORT') ?? 3306), 10),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'synapse_control'),
        entities: [User, UserAuthToken, ApiKey, Agent, Document, ChatSession, Message],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
