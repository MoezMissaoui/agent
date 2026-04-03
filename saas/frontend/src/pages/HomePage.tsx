import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">Synapse</div>
        <h1 className="text-2xl font-semibold text-slate-900">Control Plane</h1>
        <p className="mt-2 text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{user?.email}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">User ID: {user?.userId}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={() => logout()}>
            Sign out
          </Button>
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
