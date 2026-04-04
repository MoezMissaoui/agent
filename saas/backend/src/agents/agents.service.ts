import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { Document } from '../database/entities/document.entity';
import { User } from '../database/entities/user.entity';
import { DocumentStatus } from '../database/enums/document-status.enum';
import { AgentResponseDto } from './dto/agent-response.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Document)
    private readonly documents: Repository<Document>,
  ) {}

  async create(userIdentifier: string, dto: CreateAgentDto): Promise<AgentResponseDto> {
    const nameTrim = dto.name.trim();
    if (!nameTrim) {
      throw new BadRequestException('Name is required.');
    }
    const descTrim = dto.description?.trim() ?? '';
    const descriptionValue = descTrim || null;

    const user = await this.findUserByIdentifier(userIdentifier);

    const agent = this.agents.create({
      userId: user.id,
      name: nameTrim,
      description: descriptionValue,
      isActive: false,
    });
    const saved = await this.agents.save(agent);

    return this.toResponse(saved);
  }

  async findAll(userIdentifier: string): Promise<AgentResponseDto[]> {
    const user = await this.findUserByIdentifier(userIdentifier);
    const rows = await this.agents.find({
      where: { userId: user.id },
      order: { updatedAt: 'DESC' },
    });
    return rows.map((a) => this.toResponse(a));
  }

  async findOne(userIdentifier: string, agentId: string): Promise<AgentResponseDto> {
    const user = await this.findUserByIdentifier(userIdentifier);
    const row = await this.agents.findOne({
      where: { userId: user.id, identifier: agentId },
    });
    if (!row) {
      throw new NotFoundException('Agent not found');
    }
    return this.toResponse(row);
  }

  async update(
    userIdentifier: string,
    agentId: string,
    dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    const hasName = dto.name !== undefined;
    const hasDescription = dto.description !== undefined;
    const hasIsActive = dto.isActive !== undefined;
    if (!hasName && !hasDescription && !hasIsActive) {
      throw new BadRequestException('At least one of name, description, isActive must be provided.');
    }

    const user = await this.findUserByIdentifier(userIdentifier);
    const row = await this.agents.findOne({
      where: { userId: user.id, identifier: agentId },
    });
    if (!row) {
      throw new NotFoundException('Agent not found');
    }

    if (hasName) {
      const t = dto.name!.trim();
      if (!t) {
        throw new BadRequestException('Name cannot be empty.');
      }
      row.name = t;
    }
    if (hasDescription) {
      const t = dto.description!.trim();
      row.description = t ? t : null;
    }
    if (hasIsActive) {
      if (dto.isActive === true) {
        await this.assertHasReadyDocument(row.id);
      }
      row.isActive = dto.isActive!;
    }

    const saved = await this.agents.save(row);
    return this.toResponse(saved);
  }

  async remove(userIdentifier: string, agentId: string): Promise<void> {
    const user = await this.findUserByIdentifier(userIdentifier);
    const res = await this.agents.delete({
      userId: user.id,
      identifier: agentId,
    });
    if (!res.affected) {
      throw new NotFoundException('Agent not found');
    }
  }

  /** At least one document with ingestion finished (Chroma) — status READY in Control Plane. */
  private async assertHasReadyDocument(agentPk: number): Promise<void> {
    const n = await this.documents.count({
      where: { agentId: agentPk, status: DocumentStatus.READY },
    });
    if (n === 0) {
      throw new BadRequestException(
        'Cannot activate this agent until at least one document has finished ingestion (READY).',
      );
    }
  }

  private async findUserByIdentifier(userIdentifier: string): Promise<User> {
    const user = await this.users.findOne({ where: { identifier: userIdentifier } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toResponse(agent: Agent): AgentResponseDto {
    return {
      agentId: agent.identifier,
      name: agent.name,
      description: agent.description,
      isActive: agent.isActive,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}
