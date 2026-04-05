import { Link } from 'react-router-dom';
import { AgentProductPageShell } from '../../components/admin/AgentProductPageShell';

export function AdminWorkspaceSettingsPage() {
  return (
    <AgentProductPageShell eyebrow="Workspace" title="Settings">
      <p>
        <strong className="font-medium text-slate-800 dark:text-slate-200">Account &amp; security</strong> — password
        and profile details are under{' '}
        <Link to="/admin/profile" className="font-medium text-primary hover:underline">
          Profile
        </Link>
        .
      </p>
      <p>
        <strong className="font-medium text-slate-800 dark:text-slate-200">AI assistants &amp; data</strong> — each
        assistant has its own name, description, documents, and chat history. Manage lifecycle and ingestion from{' '}
        <Link to="/admin/agents" className="font-medium text-primary hover:underline">
          AI assistants
        </Link>
        ; expose them on the web or in apps via{' '}
        <Link to="/admin/api-keys" className="font-medium text-primary hover:underline">
          API access
        </Link>
        .
      </p>
      <p>
        Workspace-wide preferences (defaults, notifications) will appear here as the product grows; assistant setup and
        API integration stay in <span className="font-medium text-slate-800 dark:text-slate-200">AI assistants</span> and{' '}
        <span className="font-medium text-slate-800 dark:text-slate-200">API access</span>.
      </p>
    </AgentProductPageShell>
  );
}
