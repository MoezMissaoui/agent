import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

const authBrandTitle =
  import.meta.env.VITE_APP_NAME?.trim() || 'Synapse';

export function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col bg-surface px-4 py-12 dark:bg-surface-dark">
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2 text-primary transition hover:opacity-90"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary dark:bg-primary/20">
            S
          </span>
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {authBrandTitle}
          </span>
        </Link>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/40">
          <h1 className="text-center text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
