import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AnimatedNotice } from '../components/ui/AnimatedNotice';
import { AuthLayout } from '../layouts/AuthLayout';
import { getRequestErrorMessage } from '../lib/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      navigate('/admin');
    } catch (err) {
      setError(getRequestErrorMessage(err));
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Synapse Control Plane">
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
    </AuthLayout>
  );
}
