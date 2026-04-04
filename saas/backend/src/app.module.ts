import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentChatModule } from './agent-chat/agent-chat.module';
import { AgentIngestModule } from './agent-ingest/agent-ingest.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    DatabaseModule,
    AuthModule.forRoot(),
    AgentsModule,
    AgentIngestModule,
    AgentChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
