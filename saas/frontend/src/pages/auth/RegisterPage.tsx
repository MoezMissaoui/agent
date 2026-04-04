import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { AnimatedNotice } from '../../components/ui/AnimatedNotice';
import { AuthLayout } from '../../layouts/AuthLayout';
import { getRequestErrorMessage } from '../../lib/errors';
import { googleOAuthStartUrl, isGoogleAuthEnabled } from '../../lib/google-auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      const result = await register(username.trim(), email, password);
      if (
        'requiresEmailVerification' in result &&
        result.requiresEmailVerification
      ) {
        navigate(
          `/login?pendingVerification=1&email=${encodeURIComponent(email)}`,
        );
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(getRequestErrorMessage(err));
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Create your account to get started">
      <>
      {isGoogleAuthEnabled() ? (
        <div className="mb-5 flex flex-col gap-3">
          <a
            href={googleOAuthStartUrl()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-md transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </a>
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="text-center text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Or register with email
            </p>
          </div>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AnimatedNotice show={Boolean(error)} variant="error" contentKey={error}>
          {error}
        </AnimatedNotice>
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" className="w-full">
          Register
        </Button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
      </>
    </AuthLayout>
  );
}
