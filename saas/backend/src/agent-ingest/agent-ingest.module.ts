import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../database/entities/agent.entity';
import { Document } from '../database/entities/document.entity';
import { User } from '../database/entities/user.entity';
import { AgentIngestController } from './agent-ingest.controller';
import { AgentIngestService } from './agent-ingest.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, User, Document])],
  controllers: [AgentIngestController],
  providers: [AgentIngestService],
})
export class AgentIngestModule {}
