import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../database/entities/agent.entity';
import { ChatSession } from '../database/entities/chat-session.entity';
import { Document } from '../database/entities/document.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';
import { AgentChatController } from './agent-chat.controller';
import { AgentChatService } from './agent-chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, User, Document, ChatSession, Message])],
  controllers: [AgentChatController],
  providers: [AgentChatService],
})
export class AgentChatModule {}
