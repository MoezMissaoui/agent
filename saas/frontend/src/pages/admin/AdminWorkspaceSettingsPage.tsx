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
        <strong className="font-medium text-slate-800 dark:text-slate-200">Agents &amp; data</strong> — each assistant has
        its own name, description, documents, and chat history. Manage lifecycle and ingestion from{' '}
        <Link to="/admin/agents" className="font-medium text-primary hover:underline">
          Agents
        </Link>
        .
      </p>
      <p>
        Workspace-wide preferences (defaults, notifications) will appear here as the product grows; the live workflow
        for building agents stays in the Agents area.
      </p>
    </AgentProductPageShell>
  );
}
