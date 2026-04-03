import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordRequest } from '../api/auth';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AuthLayout } from '../layouts/AuthLayout';
import { getRequestErrorMessage } from '../lib/errors';

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = search.get('token') ?? '';
  const tokenMissing = !token;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return;
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      setError(getRequestErrorMessage(err));
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can sign in with your new password">
        <div className="flex flex-col gap-4">
          <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="New password" subtitle="Choose a strong password">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {tokenMissing ? (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Missing token in URL. Open the link from your email.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <PasswordInput
          label="New password"
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
        <Button type="submit" className="w-full" disabled={tokenMissing}>
          Update password
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
