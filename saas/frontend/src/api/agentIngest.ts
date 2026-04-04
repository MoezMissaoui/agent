import { api } from '../lib/api';

const base = (agentId: string) => `/api/v1.0/agents/${encodeURIComponent(agentId)}/documents`;

export type AgentDocumentRow = {
  documentId: string;
  filename: string;
  status: string;
  createdAt: string;
};

export type IngestJobStatus = {
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

export async function listAgentDocuments(agentId: string): Promise<AgentDocumentRow[]> {
  const { data } = await api.get<AgentDocumentRow[]>(base(agentId));
  return data;
}

export async function uploadAgentDocument(agentId: string, file: File): Promise<{ jobId: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post<{ jobId: string }>(`${base(agentId)}/ingest`, fd);
  return data;
}

export async function getIngestJobStatus(agentId: string, jobId: string): Promise<IngestJobStatus> {
  const { data } = await api.get<IngestJobStatus>(`${base(agentId)}/ingest/status/${encodeURIComponent(jobId)}`);
  return data;
}
