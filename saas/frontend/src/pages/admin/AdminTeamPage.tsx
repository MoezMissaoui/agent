import { Link } from 'react-router-dom';
import { AgentProductPageShell } from '../../components/admin/AgentProductPageShell';

export function AdminTeamPage() {
  return (
    <AgentProductPageShell eyebrow="Workspace" title="Team">
      <p>
        This workspace is tied to your account. Shared team access, roles, and invitations are planned so you can
        collaborate on the same agents and knowledge bases.
      </p>
      <p>
        Today, you can build and run <strong className="font-medium text-slate-800 dark:text-slate-200">agents</strong>{' '}
        independently: create them under{' '}
        <Link to="/admin/agents" className="font-medium text-primary hover:underline">
          Agents
        </Link>
        , attach documents, and use chat when ingestion is complete.
      </p>
    </AgentProductPageShell>
  );
}
