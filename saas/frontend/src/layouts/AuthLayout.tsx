import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-primary">
          <span className="text-2xl font-semibold tracking-tight">Synapse</span>
        </Link>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h1 className="text-center text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-center text-sm text-slate-500">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
