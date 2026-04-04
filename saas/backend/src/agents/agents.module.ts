import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../database/entities/agent.entity';
import { Document } from '../database/entities/document.entity';
import { User } from '../database/entities/user.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, User, Document])],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
