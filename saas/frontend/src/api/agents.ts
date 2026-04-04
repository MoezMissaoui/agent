import { api } from '../lib/api';

const base = '/api/v1.0/agents';

export type CreateAgentPayload = {
  name: string;
  description?: string;
};

export type CreatedAgent = {
  agentId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
};

export async function createAgent(payload: CreateAgentPayload): Promise<CreatedAgent> {
  const { data } = await api.post<CreatedAgent>(base, payload);
  return data;
}
