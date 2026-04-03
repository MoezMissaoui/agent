import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthLayout } from '../layouts/AuthLayout';
import { getRequestErrorMessage } from '../lib/errors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [mailDelivery, setMailDelivery] = useState<'email' | 'dev_log' | undefined>();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await forgotPasswordRequest(email);
      setMailDelivery(res.mailDelivery);
      setDone(true);
    } catch (err) {
      setError(getRequestErrorMessage(err));
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a reset link to your inbox.">
        {mailDelivery === 'dev_log' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">Development mode (no real email)</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              The reset link is only written to the <strong>backend server logs</strong>, not to your inbox.
              Check the terminal where Nest runs, or run:{' '}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs dark:bg-amber-900/80">
                docker compose logs -f backend
              </code>
            </p>
          </div>
        ) : null}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          You can close this page or{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            return to sign in
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="We will email you a reset link">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
