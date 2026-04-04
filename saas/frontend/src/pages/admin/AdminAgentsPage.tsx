import { useCallback, useState, type FormEvent } from 'react';
import { createAgent } from '../../api/agents';
import { Button } from '../../components/ui/Button';
import { FormFeedback } from '../../components/ui/FormFeedback';
import { Input } from '../../components/ui/Input';
import { getRequestErrorMessage } from '../../lib/errors';

export function AdminAgentsPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setSubmitting(true);
      try {
        const agent = await createAgent({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        setSuccess(
          `Agent created: ${agent.name} (id ${agent.agentId}).`,
        );
        setName('');
        setDescription('');
      } catch (err) {
        setError(getRequestErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [name, description],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Data / AI</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Agents</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Create an agent (name and description). Data is stored in the Control Plane database.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">New agent</h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <Input
            name="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
          <div className="w-full">
            <label htmlFor="agent-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="agent-description"
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Scope, tone, or mission (optional)"
            />
          </div>
          <FormFeedback variant="error" message={error} />
          <FormFeedback variant="success" message={success} />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create agent'}
          </Button>
        </form>
      </div>
    </div>
  );
}
