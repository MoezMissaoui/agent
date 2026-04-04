import { api } from '../lib/api';

const base = (agentId: string) =>
  `/api/v1.0/agents/${encodeURIComponent(agentId)}/chat`;

export type ChatStatus = {
  chatEnabled: boolean;
};

export type ChatSessionSummary = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

export async function getChatStatus(agentId: string): Promise<ChatStatus> {
  const { data } = await api.get<ChatStatus>(`${base(agentId)}/status`);
  return data;
}

export async function listChatSessions(agentId: string): Promise<{ sessions: ChatSessionSummary[] }> {
  const { data } = await api.get<{ sessions: ChatSessionSummary[] }>(`${base(agentId)}/sessions`);
  return data;
}

export async function createChatSession(agentId: string): Promise<{ sessionId: string }> {
  const { data } = await api.post<{ sessionId: string }>(`${base(agentId)}/sessions`);
  return data;
}

export async function getChatSessionMessages(
  agentId: string,
  sessionId: string,
): Promise<{ sessionId: string; messages: ChatMessage[] }> {
  const { data } = await api.get<{ sessionId: string; messages: ChatMessage[] }>(
    `${base(agentId)}/sessions/${encodeURIComponent(sessionId)}`,
  );
  return data;
}

export async function sendChatMessage(
  agentId: string,
  sessionId: string,
  content: string,
): Promise<{ answer: string; userMessageId: string; assistantMessageId: string }> {
  const { data } = await api.post<{ answer: string; userMessageId: string; assistantMessageId: string }>(
    `${base(agentId)}/sessions/${encodeURIComponent(sessionId)}/messages`,
    { content },
  );
  return data;
}
