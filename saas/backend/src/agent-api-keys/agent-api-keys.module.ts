import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../database/entities/api-key.entity';
import { Agent } from '../database/entities/agent.entity';
import { User } from '../database/entities/user.entity';
import { AgentApiKeysController } from './agent-api-keys.controller';
import { AgentApiKeysService } from './agent-api-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, Agent, User])],
  controllers: [AgentApiKeysController],
  providers: [AgentApiKeysService],
  exports: [AgentApiKeysService],
})
export class AgentApiKeysModule {}
