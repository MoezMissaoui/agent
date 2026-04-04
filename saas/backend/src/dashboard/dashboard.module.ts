import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../database/entities/agent.entity';
import { ChatSession } from '../database/entities/chat-session.entity';
import { Document } from '../database/entities/document.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Agent, ChatSession, Message, Document])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
