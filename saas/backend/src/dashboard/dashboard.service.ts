import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { ChatSession } from '../database/entities/chat-session.entity';
import { Document } from '../database/entities/document.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';
import { DocumentStatus } from '../database/enums/document-status.enum';

export type DashboardRecentSession = {
  sessionId: string;
  agentName: string;
  updatedAt: string;
};

export type DashboardPayload = {
  totalAgents: number;
  documentsReady: number;
  chatSessionsLast24h: number;
  messagesLast24h: number;
  recentSessions: DashboardRecentSession[];
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Agent) private readonly agents: Repository<Agent>,
    @InjectRepository(ChatSession) private readonly sessions: Repository<ChatSession>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
  ) {}

  private since24h(): Date {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  async getDashboard(userIdentifier: string): Promise<DashboardPayload> {
    const user = await this.users.findOne({ where: { identifier: userIdentifier } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const since = this.since24h();
    const agentRows = await this.agents.find({
      where: { userId: user.id },
      select: ['id'],
    });
    const agentIds = agentRows.map((a) => a.id);

    const totalAgents = agentRows.length;

    if (agentIds.length === 0) {
      return {
        totalAgents: 0,
        documentsReady: 0,
        chatSessionsLast24h: 0,
        messagesLast24h: 0,
        recentSessions: [],
      };
    }

    const [documentsReady, chatSessionsLast24h, messagesLast24h, recentRows] = await Promise.all([
      this.documents.count({
        where: { agentId: In(agentIds), status: DocumentStatus.READY },
      }),
      this.sessions.count({
        where: { agentId: In(agentIds), updatedAt: MoreThanOrEqual(since) },
      }),
      this.messages
        .createQueryBuilder('m')
        .innerJoin('m.session', 's')
        .where('s.agentId IN (:...agentIds)', { agentIds })
        .andWhere('m.createdAt >= :since', { since })
        .getCount(),
      this.sessions.find({
        where: { agentId: In(agentIds) },
        relations: ['agent'],
        order: { updatedAt: 'DESC' },
        take: 8,
      }),
    ]);

    const recentSessions: DashboardRecentSession[] = recentRows.map((s) => ({
      sessionId: s.identifier,
      agentName: s.agent?.name?.trim() || 'Agent',
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      totalAgents,
      documentsReady,
      chatSessionsLast24h,
      messagesLast24h,
      recentSessions,
    };
  }
}
