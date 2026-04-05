import { api } from '../lib/api';

export const MAX_AGENT_API_ACCESS_TOKENS = 3;

export type AgentApiAccessToken = {
  identifier: string;
  name: string;
  tokenPrefix: string;
  expiresAt: string | null;
  createdAt: string;
};

export type AgentApiAccessTokenCreated = AgentApiAccessToken & { token: string };

export async function listAgentApiAccessTokens(agentId: string): Promise<AgentApiAccessToken[]> {
  const { data } = await api.get<AgentApiAccessToken[]>(
    `/api/v1.0/agents/${encodeURIComponent(agentId)}/api-access-tokens`,
  );
  return data;
}

export async function createAgentApiAccessToken(
  agentId: string,
  payload: { name: string; expiresAt: string | null | undefined },
): Promise<AgentApiAccessTokenCreated> {
  const { data } = await api.post<AgentApiAccessTokenCreated>(
    `/api/v1.0/agents/${encodeURIComponent(agentId)}/api-access-tokens`,
    payload,
  );
  return data;
}

/** Full token; only for signed-in owner (dashboard). */
export async function revealAgentApiAccessTokenSecret(
  agentId: string,
  tokenId: string,
): Promise<{ token: string }> {
  const { data } = await api.get<{ token: string }>(
    `/api/v1.0/agents/${encodeURIComponent(agentId)}/api-access-tokens/${encodeURIComponent(tokenId)}/secret`,
  );
  return data;
}

export async function deleteAgentApiAccessToken(agentId: string, tokenId: string): Promise<void> {
  await api.delete(
    `/api/v1.0/agents/${encodeURIComponent(agentId)}/api-access-tokens/${encodeURIComponent(tokenId)}`,
  );
}
