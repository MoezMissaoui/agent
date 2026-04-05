import { AgentProductPageShell } from '../../components/admin/AgentProductPageShell';

export function AdminApiKeysProductPage() {
  return (
    <AgentProductPageShell eyebrow="Integrations" title="API access">
      <p>
        Use the Control Plane REST API to embed your <strong className="font-medium text-slate-800 dark:text-slate-200">AI assistants</strong> on a
        website, in a mobile app, or in any backend: document ingestion, chat sessions, and assistant metadata all use
        the same endpoints you rely on from this console.
      </p>
      <p>
        The web app signs in with a session (JWT). For production integrations, call the API from your server with{' '}
        <strong className="font-medium text-slate-800 dark:text-slate-200">X-API-Key</strong> plus your auth model — keep
        keys out of public bundles; only trusted backends should talk to the Control Plane on behalf of users.
      </p>
      <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        Workflows you run from <span className="font-medium">AI assistants</span> in the UI (upload → index → chat) map
        directly to API calls — the same surface powers custom sites, widgets, and internal tools.
      </p>
    </AgentProductPageShell>
  );
}
