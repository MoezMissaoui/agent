import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getDashboard, type DashboardPayload } from '../../api/dashboard';
import { AgentChatPanel } from '../../components/agents/AgentChatPanel';
import { useAuth } from '../../hooks/useAuth';
import { getRequestErrorMessage } from '../../lib/errors';

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type DashboardChatModal = {
  agentId: string;
  agentName: string;
  sessionId: string;
};

export function AdminHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatModal, setChatModal] = useState<DashboardChatModal | null>(null);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getDashboard()
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getRequestErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentSessionsFive = (data?.recentSessions ?? []).slice(0, 5);

  const statCards = data
    ? [
        { label: 'AI assistants', value: String(data.totalAgents), hint: 'In your workspace' },
        {
          label: 'Documents ready',
          value: String(data.documentsReady),
          hint: 'Indexed for RAG (your assistants)',
        },
        {
          label: 'Chat sessions',
          value: String(data.chatSessionsLast24h),
          hint: 'Updated in the last 24h',
        },
        {
          label: 'Messages',
          value: String(data.messagesLast24h),
          hint: 'Sent in the last 24h',
        },
      ]
    : [
        { label: 'AI assistants', value: '—', hint: '—' },
        { label: 'Documents ready', value: '—', hint: '—' },
        { label: 'Chat sessions', value: '—', hint: 'Last 24h' },
        { label: 'Messages', value: '—', hint: 'Last 24h' },
      ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{user?.username}</span>
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {loading && !data ? '…' : card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent chat sessions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Latest 5 sessions by update time. Click a row to open the conversation.
          </p>
          {loading && !data ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : data && recentSessionsFive.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No chat sessions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentSessionsFive.map((row) => (
                <li key={row.sessionId}>
                  <button
                    type="button"
                    disabled={!row.agentId}
                    onClick={() => {
                      if (!row.agentId) return;
                      setChatRefreshKey((k) => k + 1);
                      setChatModal({
                        agentId: row.agentId,
                        agentName: row.agentName,
                        sessionId: row.sessionId,
                      });
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-surface px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-surface-dark dark:text-slate-300 dark:hover:border-primary/40 dark:hover:bg-primary/10"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">
                        {row.sessionTitle?.trim() ? row.sessionTitle.trim() : 'Conversation'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{row.agentName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{formatRelative(row.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick start</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Build AI assistants, attach knowledge, and integrate via API. Each row opens that section.
          </p>
          <ul className="mt-4 space-y-1">
            {(
              [
                { to: '/admin/agents', label: 'AI assistants — create & manage', primary: true },
                { to: '/admin/api-keys', label: 'API access', primary: false },
                { to: '/admin/settings', label: 'Workspace settings', primary: false },
                { to: '/admin/profile', label: 'Profile', primary: false },
              ] as const
            ).map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                    item.primary
                      ? 'font-semibold text-primary hover:bg-primary/10 hover:underline dark:hover:bg-primary/15'
                      : 'font-medium text-primary hover:bg-primary/5 hover:underline dark:text-primary dark:hover:bg-primary/10'
                  }`}
                >
                  <span>{item.label}</span>
                  <svg
                    className="size-4 shrink-0 text-primary/60 transition group-hover:text-primary group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {chatModal && (
            <motion.div
              className="fixed inset-0 z-[100] flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
                aria-label="Close chat"
                onClick={() => setChatModal(null)}
              />
              <motion.div
                key={`${chatModal.agentId}-${chatModal.sessionId}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-chat-modal-title"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                className="relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l border-slate-200/90 bg-white shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.2)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.45)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="dashboard-chat-modal-title" className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                      {chatModal.agentName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chat session</p>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label="Close"
                    onClick={() => setChatModal(null)}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-950/40">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <AgentChatPanel
                      key={`${chatModal.agentId}-${chatModal.sessionId}`}
                      agentId={chatModal.agentId}
                      refreshKey={chatRefreshKey}
                      layout="modal"
                      initialSessionId={chatModal.sessionId}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
