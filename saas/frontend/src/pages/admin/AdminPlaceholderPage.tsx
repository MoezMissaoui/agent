import { Link } from 'react-router-dom';

type Props = {
  title: string;
  description?: string;
};

export function AdminPlaceholderPage({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{title}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {description ?? 'This section will be wired to your backend when ready.'}
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-8 text-center dark:border-slate-700/80 dark:bg-slate-900/80">
        <p className="text-sm text-slate-500 dark:text-slate-500">No data yet — placeholder screen.</p>
        <Link
          to="/admin"
          className="mt-4 inline-block text-sm font-medium text-primary transition hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
