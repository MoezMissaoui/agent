import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/** Shared layout for secondary admin pages — always ties back to the agent-creation workflow. */
export function AgentProductPageShell({ eyebrow, title, children }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>

      <div className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-primary/5 p-5 dark:from-primary/15 dark:to-primary/5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Create &amp; manage agents</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Define assistants, upload knowledge, and chat with the RAG pipeline — everything starts in{' '}
          <Link to="/admin/agents" className="font-medium text-primary hover:underline">
            Agents
          </Link>
          .
        </p>
        <Link
          to="/admin/agents"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
        >
          Open Agents
        </Link>
      </div>
    </div>
  );
}
