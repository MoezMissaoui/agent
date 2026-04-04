import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { ChatSession } from '../database/entities/chat-session.entity';
import { Document as DocumentEntity } from '../database/entities/document.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';
import { DocumentStatus } from '../database/enums/document-status.enum';
import { MessageRole } from '../database/enums/message-role.enum';

const CHAT_TIMEOUT_MS = 120_000;

export type ChatStatusPayload = {
  chatEnabled: boolean;
};

export type ChatSessionRow = {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageRow = {
  messageId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
};

@Injectable()
export class AgentChatService {
  private readonly logger = new Logger(AgentChatService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(DocumentEntity)
    private readonly documents: Repository<DocumentEntity>,
    @InjectRepository(ChatSession)
    private readonly sessions: Repository<ChatSession>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    private readonly config: ConfigService,
  ) {}

  async getStatus(userIdentifier: string, agentUuid: string): Promise<ChatStatusPayload> {
    const agent = await this.resolveAgent(userIdentifier, agentUuid);
    const chatEnabled = await this.hasReadyDocument(agent.id);
    return { chatEnabled };
  }

  async listSessions(userIdentifier: string, agentUuid: string): Promise<{ sessions: ChatSessionRow[] }> {
    const agent = await this.resolveAgent(userIdentifier, agentUuid);
    await this.assertChatEnabled(agent.id);
    const rows = await this.sessions.find({
      where: { agentId: agent.id },
      order: { updatedAt: 'DESC' },
    });
    return {
      sessions: rows.map((s) => ({
        sessionId: s.identifier,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };
  }

  async createSession(userIdentifier: string, agentUuid: string): Promise<{ sessionId: string }> {
    const agent = await this.resolveAgent(userIdentifier, agentUuid);
    await this.assertChatEnabled(agent.id);
    const row = this.sessions.create({ agentId: agent.id });
    const saved = await this.sessions.save(row);
    return { sessionId: saved.identifier };
  }

  async getSessionMessages(
    userIdentifier: string,
    agentUuid: string,
    sessionUuid: string,
  ): Promise<{ sessionId: string; messages: ChatMessageRow[] }> {
    const agent = await this.resolveAgent(userIdentifier, agentUuid);
    await this.assertChatEnabled(agent.id);
    const session = await this.sessions.findOne({
      where: { agentId: agent.id, identifier: sessionUuid },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    const msgs = await this.messages.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
    });
    return {
      sessionId: session.identifier,
      messages: msgs.map((m) => ({
        messageId: m.identifier,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async sendMessage(
    userIdentifier: string,
    agentUuid: string,
    sessionUuid: string,
    rawContent: string,
  ): Promise<{ answer: string; userMessageId: string; assistantMessageId: string }> {
    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('Message content is required.');
    }

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
    await this.assertChatEnabled(agent.id);

    const session = await this.sessions.findOne({
      where: { agentId: agent.id, identifier: sessionUuid },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    const prior = await this.messages.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
    });

    const history = prior.map((m) => ({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content,
    }));

    const baseUrl = this.dataPlaneBase();
    const url = `${baseUrl}/internal/v1/chat`;
    const payload = {
      user_id: user.identifier,
      agent_id: agent.identifier,
      agent_name: agent.name,
      agent_description: agent.description,
      session_id: session.identifier,
      query: content,
      history,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const key = this.agentApiKey();
    if (key) {
      headers['X-API-Key'] = key;
    }

    let answer: string;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`Data Plane chat failed: ${res.status} ${text}`);
        throw new BadGatewayException(
          `Data Plane chat failed: ${text || res.statusText || res.status}`,
        );
      }
      const data = (await res.json()) as { answer?: string };
      answer = typeof data.answer === 'string' ? data.answer : '';
    } catch (e) {
      if (e instanceof BadGatewayException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.warn(`Data Plane chat error: ${msg}`);
      throw new BadGatewayException(`Data Plane chat error: ${msg}`);
    }

    const userMsg = this.messages.create({
      sessionId: session.id,
      role: MessageRole.USER,
      content,
    });
    const asstMsg = this.messages.create({
      sessionId: session.id,
      role: MessageRole.ASSISTANT,
      content: answer,
    });
    const savedUser = await this.messages.save(userMsg);
    const savedAsst = await this.messages.save(asstMsg);
    await this.sessions.update({ id: session.id }, { updatedAt: new Date() });

    return {
      answer,
      userMessageId: savedUser.identifier,
      assistantMessageId: savedAsst.identifier,
    };
  }

  async deleteSession(
    userIdentifier: string,
    agentUuid: string,
    sessionUuid: string,
  ): Promise<void> {
    const agent = await this.resolveAgent(userIdentifier, agentUuid);
    await this.assertChatEnabled(agent.id);
    const session = await this.sessions.findOne({
      where: { agentId: agent.id, identifier: sessionUuid },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    await this.messages.delete({ sessionId: session.id });
    await this.sessions.delete({ id: session.id });
  }

  private async resolveAgent(userIdentifier: string, agentUuid: string): Promise<Agent> {
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

  private async hasReadyDocument(agentPk: number): Promise<boolean> {
    const n = await this.documents.count({
      where: { agentId: agentPk, status: DocumentStatus.READY },
    });
    return n > 0;
  }

  private async assertChatEnabled(agentPk: number): Promise<void> {
    const ok = await this.hasReadyDocument(agentPk);
    if (!ok) {
      throw new ForbiddenException(
        'Chat is available only after at least one document has been successfully ingested.',
      );
    }
  }

  private dataPlaneBase(): string {
    return this.config.get<string>('DATA_PLANE_BASE_URL', 'http://127.0.0.1:8546').replace(/\/$/, '');
  }

  private agentApiKey(): string {
    const fromEnv = process.env.AGENT_API_X_KEY?.trim();
    if (fromEnv) {
      return fromEnv;
    }
    return (this.config.get<string>('AGENT_API_X_KEY') ?? '').trim();
  }
}
