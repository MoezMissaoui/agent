import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Stand-in for future `/` landing: for now → /admin if signed in, else /login. */
export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-slate-600 transition-colors dark:bg-surface-dark dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}
