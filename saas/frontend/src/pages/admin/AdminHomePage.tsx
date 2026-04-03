import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const statCards = [
  { label: 'Total users', value: '—', hint: 'Placeholder' },
  { label: 'Active sessions', value: '—', hint: 'Last 24h' },
  { label: 'API requests', value: '—', hint: 'Last 24h' },
  { label: 'Status', value: 'Operational', hint: 'All services' },
] as const;

export function AdminHomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Audit log and events will appear here.</p>
          <ul className="mt-4 space-y-3">
            {['Configuration saved', 'New API key created', 'User invited'].map((line, i) => (
              <li
                key={line}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-surface px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700/60 dark:bg-surface-dark dark:text-slate-300"
              >
                <span>{line}</span>
                <span className="shrink-0 text-xs text-slate-400">{i + 1}h ago</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                to="/admin/users"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10 dark:hover:bg-primary/15"
              >
                Manage users
              </Link>
            </li>
            <li>
              <Link
                to="/admin/api-keys"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10 dark:hover:bg-primary/15"
              >
                API keys
              </Link>
            </li>
            <li>
              <Link
                to="/admin/settings"
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10 dark:hover:bg-primary/15"
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
