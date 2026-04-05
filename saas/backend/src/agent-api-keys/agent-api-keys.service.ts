import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { ApiKey } from '../database/entities/api-key.entity';
import { Agent } from '../database/entities/agent.entity';
import { User } from '../database/entities/user.entity';
import { CreateAgentApiAccessTokenDto } from './dto/create-agent-api-access-token.dto';

export const MAX_AGENT_API_ACCESS_TOKENS = 3;

export type AgentApiAccessTokenListItem = {
  identifier: string;
  name: string;
  tokenPrefix: string;
  expiresAt: string | null;
  createdAt: string;
};

export type AgentApiAccessTokenCreated = AgentApiAccessTokenListItem & {
  token: string;
};

@Injectable()
export class AgentApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeys: Repository<ApiKey>,
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async validateApiKey(
    plainToken: string,
  ): Promise<{ userId: string; email: string; agentUuid: string } | null> {
    const hash = this.hashToken(plainToken);
    const row = await this.apiKeys.findOne({
      where: { tokenHash: hash, isActive: true },
      relations: ['agent', 'agent.user'],
    });
    if (!row?.agent?.user) {
      return null;
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return {
      userId: row.agent.user.identifier,
      email: row.agent.user.email,
      agentUuid: row.agent.identifier,
    };
  }

  async list(userIdentifier: string, agentUuid: string): Promise<AgentApiAccessTokenListItem[]> {
    const agent = await this.getOwnedAgent(userIdentifier, agentUuid);
    const rows = await this.apiKeys.find({
      where: { agentId: agent.id, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toListItem(r));
  }

  async revealSecret(
    userIdentifier: string,
    agentUuid: string,
    tokenIdentifier: string,
  ): Promise<{ token: string }> {
    const agent = await this.getOwnedAgent(userIdentifier, agentUuid);
    const row = await this.apiKeys.findOne({
      where: { agentId: agent.id, identifier: tokenIdentifier, isActive: true },
    });
    if (!row) {
      throw new NotFoundException('API access token not found');
    }
    if (!row.tokenSecretCipher) {
      throw new BadRequestException(
        'This token has no stored secret (legacy). Revoke it and create a new token to use Copy.',
      );
    }
    try {
      const token = this.decryptSecret(row.tokenSecretCipher);
      return { token };
    } catch {
      throw new BadRequestException('Could not decrypt token secret.');
    }
  }

  async create(
    userIdentifier: string,
    agentUuid: string,
    dto: CreateAgentApiAccessTokenDto,
  ): Promise<AgentApiAccessTokenCreated> {
    const agent = await this.getOwnedAgent(userIdentifier, agentUuid);
    const count = await this.apiKeys.count({
      where: { agentId: agent.id, isActive: true },
    });
    if (count >= MAX_AGENT_API_ACCESS_TOKENS) {
      throw new BadRequestException(
        `Maximum of ${MAX_AGENT_API_ACCESS_TOKENS} API access tokens per assistant.`,
      );
    }
    const nameTrim = dto.name.trim();
    if (!nameTrim) {
      throw new BadRequestException('Name is required.');
    }
    const nameTaken = await this.apiKeys.findOne({
      where: { agentId: agent.id, name: nameTrim },
    });
    if (nameTaken) {
      throw new ConflictException(
        'An API access token with this name already exists for this assistant.',
      );
    }
    let expiresAt: Date | null = null;
    if (dto.expiresAt != null && dto.expiresAt !== '') {
      const d = new Date(dto.expiresAt);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('expiresAt must be a valid ISO date string.');
      }
      expiresAt = d;
    }
    const { plain, hash, prefix } = this.generateSecret();
    const row = this.apiKeys.create({
      agentId: agent.id,
      tokenHash: hash,
      tokenPrefix: prefix,
      tokenSecretCipher: this.encryptSecret(plain),
      name: nameTrim,
      expiresAt,
      isActive: true,
    });
    const saved = await this.apiKeys.save(row);
    return {
      ...this.toListItem(saved),
      token: plain,
    };
  }

  async remove(userIdentifier: string, agentUuid: string, tokenIdentifier: string): Promise<void> {
    const agent = await this.getOwnedAgent(userIdentifier, agentUuid);
    const res = await this.apiKeys.delete({
      agentId: agent.id,
      identifier: tokenIdentifier,
    });
    if (!res.affected) {
      throw new NotFoundException('API access token not found');
    }
  }

  private async getOwnedAgent(userIdentifier: string, agentUuid: string): Promise<Agent> {
    const user = await this.users.findOne({ where: { identifier: userIdentifier } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const agent = await this.agents.findOne({
      where: { userId: user.id, identifier: agentUuid },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  private toListItem(r: ApiKey): AgentApiAccessTokenListItem {
    return {
      identifier: r.identifier,
      name: r.name,
      tokenPrefix: r.tokenPrefix,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private encryptionKey(): Buffer {
    const explicit = this.config.get<string>('API_ACCESS_TOKEN_ENCRYPTION_KEY');
    if (explicit?.trim()) {
      return createHash('sha256').update(explicit.trim(), 'utf8').digest();
    }
    const jwt = this.config.get<string>('JWT_SECRET', 'dev-secret-change-me');
    return createHash('sha256').update(`synapse-api-token-wrap:${jwt}`, 'utf8').digest();
  }

  private encryptSecret(plain: string): string {
    const key = this.encryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  private decryptSecret(stored: string): string {
    const raw = Buffer.from(stored, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const key = this.encryptionKey();
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }

  private generateSecret(): { plain: string; hash: string; prefix: string } {
    const plain = `syn_${randomBytes(24).toString('hex')}`;
    const hash = this.hashToken(plain);
    const prefix = plain.slice(0, 14);
    return { plain, hash, prefix };
  }

  private hashToken(plain: string): string {
    return createHash('sha256').update(plain, 'utf8').digest('hex');
  }
}
