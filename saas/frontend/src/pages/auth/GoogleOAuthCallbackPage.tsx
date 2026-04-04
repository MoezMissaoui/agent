import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from '../../layouts/AuthLayout';
import { setTokens } from '../../lib/api';

export function GoogleOAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const access = params.get('accessToken');
    const refresh = params.get('refreshToken');
    if (!access || !refresh) {
      setError('Missing authentication tokens. Try signing in again.');
      return;
    }
    setTokens(access, refresh);
    let cancelled = false;
    refreshUser()
      .then(() => {
        if (!cancelled) navigate('/admin', { replace: true });
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your session. Try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser]);

  if (error) {
    return (
      <AuthLayout title="Google sign-in" subtitle="Something went wrong">
        <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button type="button" className="mt-6 w-full" onClick={() => navigate('/login')}>
          Back to sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Google sign-in" subtitle="Finishing sign-in…">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">Please wait.</p>
    </AuthLayout>
  );
}
