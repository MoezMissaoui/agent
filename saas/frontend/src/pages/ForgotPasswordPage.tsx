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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await forgotPasswordRequest(email);
      setDone(true);
    } catch (err) {
      setError(getRequestErrorMessage(err));
    }
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="If an account exists, we sent a reset link.">
        <p className="text-center text-sm text-slate-600">
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
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
