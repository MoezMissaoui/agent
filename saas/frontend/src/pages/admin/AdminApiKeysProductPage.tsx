import { AgentProductPageShell } from '../../components/admin/AgentProductPageShell';

export function AdminApiKeysProductPage() {
  return (
    <AgentProductPageShell eyebrow="Integrations" title="API access">
      <p>
        The browser app talks to the Control Plane with your session (JWT) after you sign in. Server-to-server and
        automation use the same REST API: agents, document ingestion, and chat sessions are all available for the
        authenticated user.
      </p>
      <p>
        Deployments also require an <strong className="font-medium text-slate-800 dark:text-slate-200">X-API-Key</strong>{' '}
        on requests (configured in your environment). Keep keys out of client bundles; use them only on trusted
        backends that call the Control Plane on behalf of your product.
      </p>
      <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        Agent workflows (upload → index → chat) are orchestrated through the APIs you use from{' '}
        <span className="font-medium">Agents</span> in this UI — the same endpoints power custom integrations.
      </p>
    </AgentProductPageShell>
  );
}
