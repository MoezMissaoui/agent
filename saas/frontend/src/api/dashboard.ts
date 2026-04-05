import { api } from '../lib/api';

export type DashboardRecentSession = {
  sessionId: string;
  agentId: string;
  agentName: string;
  sessionTitle: string | null;
  updatedAt: string;
};

export type DashboardPayload = {
  totalAgents: number;
  documentsReady: number;
  chatSessionsLast24h: number;
  messagesLast24h: number;
  recentSessions: DashboardRecentSession[];
};

export async function getDashboard(): Promise<DashboardPayload> {
  const { data } = await api.get<DashboardPayload>('/api/v1.0/dashboard');
  return data;
}
