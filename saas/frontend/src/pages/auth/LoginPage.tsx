import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resendVerificationRequest } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { AnimatedNotice } from '../../components/ui/AnimatedNotice';
import { AuthLayout } from '../../layouts/AuthLayout';
import { getRequestErrorCode, getRequestErrorMessage } from '../../lib/errors';
import { googleOAuthStartUrl, isGoogleAuthEnabled } from '../../lib/google-auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const verified = searchParams.get('verified');
    const err = searchParams.get('error');
    const pending = searchParams.get('pendingVerification');
    const em = searchParams.get('email');
    if (verified === '1') {
      setInfo('Your email has been verified. You can sign in.');
    }
    if (err === 'verify_failed') {
      setError('This verification link is invalid or has expired. Request a new one below.');
      setNeedsVerification(true);
    }
    if (pending === '1') {
      setInfo('We sent you a link. Please verify your email before signing in.');
      if (em) setEmail(em);
    }
    if (verified || err || pending || em) {
      const next = new URLSearchParams(searchParams);
      ['verified', 'error', 'pendingVerification', 'email'].forEach((k) =>
        next.delete(k),
      );
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo(null);
    setResendMessage(null);
    setNeedsVerification(false);
    try {
      await login(email, password, rememberMe);
      navigate('/admin');
    } catch (err) {
      setError(getRequestErrorMessage(err));
      if (getRequestErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
    }
  }

  async function onResendVerification() {
    if (!email.trim()) {
      setResendMessage('Enter your email above first.');
      return;
    }
    setResendLoading(true);
    setResendMessage(null);
    try {
      const r = await resendVerificationRequest(email.trim());
      setResendMessage(r.message);
    } catch {
      setResendMessage('Could not send. Try again later.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back">
      <>
      {info ? (
        <div
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          {info}
        </div>
      ) : null}
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
              Or sign in with email
            </p>
          </div>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AnimatedNotice show={Boolean(error)} variant="error" contentKey={error}>
          {error}
        </AnimatedNotice>
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-900"
          />
          Remember me
        </label>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        {needsVerification ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="mb-2 font-medium">Email not verified</p>
            <p className="mb-3 text-amber-900/90 dark:text-amber-100/90">
              Use the link we sent you, or request a new verification email.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={resendLoading}
              onClick={onResendVerification}
            >
              {resendLoading ? 'Sending…' : 'Resend verification email'}
            </Button>
            {resendMessage ? (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{resendMessage}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
          <span>
            No account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </span>
        </div>
      </form>
      </>
    </AuthLayout>
  );
}
