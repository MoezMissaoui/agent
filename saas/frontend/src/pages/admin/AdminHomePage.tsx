import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, type DashboardPayload } from '../../api/dashboard';
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

export function AdminHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const statCards = data
    ? [
        { label: 'Your agents', value: String(data.totalAgents), hint: 'In your workspace' },
        {
          label: 'Documents ready',
          value: String(data.documentsReady),
          hint: 'Indexed for RAG (your agents)',
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
        { label: 'Your agents', value: '—', hint: '—' },
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
            Latest activity on your agents (by session update time).
          </p>
          {loading && !data ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : data && data.recentSessions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No chat sessions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(data?.recentSessions ?? []).map((row) => (
                <li
                  key={row.sessionId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-surface px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700/60 dark:bg-surface-dark dark:text-slate-300"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{row.agentName}</span>
                    <span className="text-slate-500 dark:text-slate-400"> · session updated</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{formatRelative(row.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick start</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Build assistants and attach knowledge — the main workflow is under Agents.
          </p>
          <ul className="mt-4 space-y-1">
            <li>
              <Link
                to="/admin/agents"
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10 dark:hover:bg-primary/15"
              >
                Agents — create &amp; manage
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                Team
              </Link>
            </li>
            <li>
              <Link
                to="/admin/api-keys"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                API access
              </Link>
            </li>
            <li>
              <Link
                to="/admin/settings"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                Workspace settings
              </Link>
            </li>
            <li>
              <Link
                to="/admin/profile"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
