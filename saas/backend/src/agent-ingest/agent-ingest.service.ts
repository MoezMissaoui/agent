import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import FormData from 'form-data';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { Document as DocumentEntity } from '../database/entities/document.entity';
import { User } from '../database/entities/user.entity';
import { DocumentStatus } from '../database/enums/document-status.enum';

const INGEST_TIMEOUT_MS = 120_000;

/** In-memory upload (multer memoryStorage); avoids Express.Multer merge issues with @types/express 5. */
export type IngestUploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type IngestJobStatusPayload = {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  userId: string;
  agentId: string;
  filename: string;
  chunksIndexed: number | null;
  error: string | null;
};

@Injectable()
export class AgentIngestService {
  private readonly logger = new Logger(AgentIngestService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(DocumentEntity)
    private readonly documents: Repository<DocumentEntity>,
    private readonly config: ConfigService,
  ) {}

  async ingestDocument(
    userIdentifier: string,
    agentUuid: string,
    file: IngestUploadedFile,
  ): Promise<{ jobId: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required.');
    }
    const name = (file.originalname || 'upload').trim();
    const lower = name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.txt')) {
      throw new BadRequestException('Only .pdf and .txt files are allowed.');
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

    await this.clearTenantVectors(user.identifier, agent.identifier, agent.id);

    const baseUrl = this.dataPlaneBase();
    const url = `${baseUrl}/internal/v1/documents/ingest`;
    const form = new FormData();
    form.append('user_id', user.identifier);
    form.append('agent_id', agent.identifier);
    form.append('file', file.buffer, {
      filename: name,
      contentType: file.mimetype || 'application/octet-stream',
    });

    const body = form.getBuffer();
    const headers: Record<string, string> = {
      ...(form.getHeaders() as Record<string, string>),
      'Content-Length': String(body.length),
    };
    const key = this.agentApiKey();
    if (key) {
      headers['X-API-Key'] = key;
    }

    let jobId: string;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), INGEST_TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: body as unknown as BodyInit,
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`Data Plane ingest failed: ${res.status} ${text}`);
        throw new BadGatewayException(
          `Data Plane ingest failed: ${text || res.statusText || res.status}`,
        );
      }
      const data = (await res.json()) as { job_id?: string };
      if (!data.job_id || typeof data.job_id !== 'string') {
        throw new BadGatewayException('Data Plane returned no job_id.');
      }
      jobId = data.job_id;
    } catch (e) {
      if (e instanceof BadGatewayException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.warn(`Data Plane ingest error: ${msg}`);
      throw new BadGatewayException(`Data Plane ingest error: ${msg}`);
    }

    const doc = this.documents.create({
      agentId: agent.id,
      filename: name,
      status: DocumentStatus.PROCESSING,
    });
    await this.documents.save(doc);
    await this.touchAgentUpdatedAt(agent.id);

    return { jobId };
  }

  async listDocuments(
    userIdentifier: string,
    agentUuid: string,
  ): Promise<
    Array<{
      documentId: string;
      filename: string;
      status: DocumentStatus;
      createdAt: Date;
    }>
  > {
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
    const rows = await this.documents.find({
      where: { agentId: agent.id },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => ({
      documentId: r.identifier,
      filename: r.filename,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }

  async getIngestStatus(
    userIdentifier: string,
    agentUuid: string,
    jobId: string,
  ): Promise<IngestJobStatusPayload> {
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

    const baseUrl = this.dataPlaneBase();
    const qs = new URLSearchParams({
      user_id: user.identifier,
      agent_id: agent.identifier,
    });
    const url = `${baseUrl}/internal/v1/documents/ingest/status/${encodeURIComponent(jobId)}?${qs}`;
    const headers: Record<string, string> = {};
    const key = this.agentApiKey();
    if (key) {
      headers['X-API-Key'] = key;
    }

    let raw: Record<string, unknown>;
    try {
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text();
        throw new BadGatewayException(
          `Data Plane status failed: ${text || res.statusText || res.status}`,
        );
      }
      raw = (await res.json()) as Record<string, unknown>;
    } catch (e) {
      if (e instanceof BadGatewayException) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : 'Unknown error';
      throw new BadGatewayException(`Data Plane status error: ${msg}`);
    }

    const status = String(raw.status ?? '');
    const filename = String(raw.filename ?? '');
    const progress = Math.min(100, Math.max(0, Number(raw.progress ?? 0)));
    const currentStep = String(raw.current_step ?? raw.currentStep ?? '');
    const ciRaw = raw.chunks_indexed ?? raw.chunksIndexed;
    const chunksIndexed =
      ciRaw !== undefined && ciRaw !== null && ciRaw !== '' ? Number(ciRaw) : null;
    const err =
      raw.error !== undefined && raw.error !== null ? String(raw.error) : null;

    let normalizedStatus: 'processing' | 'completed' | 'failed' = 'processing';
    if (status === 'completed' || status === 'failed' || status === 'processing') {
      normalizedStatus = status;
    }

    const out: IngestJobStatusPayload = {
      jobId: String(raw.job_id ?? raw.jobId ?? jobId),
      status: normalizedStatus,
      progress,
      currentStep,
      userId: String(raw.user_id ?? raw.userId ?? user.identifier),
      agentId: String(raw.agent_id ?? raw.agentId ?? agent.identifier),
      filename,
      chunksIndexed: chunksIndexed !== null && Number.isFinite(chunksIndexed) ? chunksIndexed : null,
      error: err,
    };

    if (out.status === 'completed') {
      await this.markDocumentReady(agent.id, filename);
    } else if (out.status === 'failed') {
      await this.markDocumentFailed(agent.id, filename);
    }

    return out;
  }

  private async clearTenantVectors(
    userIdStr: string,
    agentIdStr: string,
    agentPk: number,
  ): Promise<void> {
    const baseUrl = this.dataPlaneBase();
    const qs = new URLSearchParams({ user_id: userIdStr, agent_id: agentIdStr });
    const url = `${baseUrl}/internal/v1/documents/all?${qs}`;
    const headers: Record<string, string> = {};
    const key = this.agentApiKey();
    if (key) {
      headers['X-API-Key'] = key;
    }
    try {
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 404) {
        this.logger.warn(`Data Plane delete all: ${res.status}`);
      }
    } catch (e) {
      this.logger.warn(`Data Plane delete all failed: ${e instanceof Error ? e.message : e}`);
    }
    await this.documents.delete({ agentId: agentPk });
  }

  private async markDocumentReady(agentPk: number, filename: string): Promise<void> {
    let row = await this.documents.findOne({
      where: { agentId: agentPk, filename },
    });
    if (!row) {
      row = await this.documents.findOne({
        where: { agentId: agentPk, status: DocumentStatus.PROCESSING },
      });
    }
    if (row) {
      row.status = DocumentStatus.READY;
      await this.documents.save(row);
      await this.touchAgentUpdatedAt(agentPk);
    }
  }

  private async markDocumentFailed(agentPk: number, filename: string): Promise<void> {
    let row = await this.documents.findOne({
      where: { agentId: agentPk, filename },
    });
    if (!row) {
      row = await this.documents.findOne({
        where: { agentId: agentPk, status: DocumentStatus.PROCESSING },
      });
    }
    if (row) {
      row.status = DocumentStatus.FAILED;
      await this.documents.save(row);
      await this.touchAgentUpdatedAt(agentPk);
    }
  }

  private async touchAgentUpdatedAt(agentPk: number): Promise<void> {
    await this.agents.update({ id: agentPk }, { updatedAt: new Date() });
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
