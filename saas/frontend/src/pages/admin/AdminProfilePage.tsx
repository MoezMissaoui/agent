import { useCallback, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function AdminProfilePage() {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  const copyIdentifier = useCallback(async () => {
    const id = user?.userId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [user?.userId]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your account details for this workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Identity</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Identifier</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {user?.userId ?? '—'}
              </code>
              {user?.userId ? (
                <button
                  type="button"
                  onClick={copyIdentifier}
                  className="shrink-0 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copiedId ? 'Copied' : 'Copy'}
                </button>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Username</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">@{user?.username ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Email status</dt>
            <dd className="mt-1">
              {user?.emailVerified ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  Not verified
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
