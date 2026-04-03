import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col bg-surface px-4 py-12 dark:bg-surface-dark">
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center pt-10">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/40">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">Synapse</div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Control Plane</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Signed in as <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">User ID: {user?.userId}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={() => logout()}>
              Sign out
            </Button>
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10 dark:hover:bg-primary/15"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
