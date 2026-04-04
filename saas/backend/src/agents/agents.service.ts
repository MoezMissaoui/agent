import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { User } from '../database/entities/user.entity';
import { CreateAgentDto } from './dto/create-agent.dto';

export type CreatedAgentResponse = {
  agentId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
};

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(userIdentifier: string, dto: CreateAgentDto): Promise<CreatedAgentResponse> {
    const nameTrim = dto.name.trim();
    if (!nameTrim) {
      throw new BadRequestException('Name is required.');
    }
    const descTrim = dto.description?.trim() ?? '';
    const descriptionValue = descTrim || null;

    const user = await this.users.findOne({ where: { identifier: userIdentifier } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const agent = this.agents.create({
      userId: user.id,
      name: nameTrim,
      description: descriptionValue,
    });
    const saved = await this.agents.save(agent);

    return {
      agentId: saved.identifier,
      name: saved.name,
      description: saved.description,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
   