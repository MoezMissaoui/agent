import { api } from '../lib/api';

const base = '/api/v1.0/agents';

export type Agent = {
  agentId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAgentPayload = {
  name: string;
  description?: string;
};

export type UpdateAgentPayload = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export async function listAgents(): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>(base);
  return data;
}

export async function getAgent(agentId: string): Promise<Agent> {
  const { data } = await api.get<Agent>(`${base}/${encodeURIComponent(agentId)}`);
  return data;
}

export async function createAgent(payload: CreateAgentPayload): Promise<Agent> {
  const { data } = await api.post<Agent>(base, payload);
  return data;
}

export async function updateAgent(agentId: string, payload: UpdateAgentPayload): Promise<Agent> {
  const { data } = await api.patch<Agent>(`${base}/${encodeURIComponent(agentId)}`, payload);
  return data;
}

export async function deleteAgent(agentId: string): Promise<void> {
  await api.delete(`${base}/${encodeURIComponent(agentId)}`);
}
