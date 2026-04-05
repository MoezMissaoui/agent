import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  MAX_AGENT_API_ACCESS_TOKENS,
  createAgentApiAccessToken,
  deleteAgentApiAccessToken,
  listAgentApiAccessTokens,
  revealAgentApiAccessTokenSecret,
  type AgentApiAccessToken,
} from '../../api/agentApiKeys';
import { listAgents, type Agent } from '../../api/agents';
import { Button } from '../../components/ui/Button';
import { DateTimePickerField } from '../../components/ui/DateTimePickerField';
import { FormFeedback } from '../../components/ui/FormFeedback';
import { Input } from '../../components/ui/Input';
import { getRequestErrorMessage } from '../../lib/errors';

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function TokenCountBadge({ count }: { count: number }) {
  const full = count >= MAX_AGENT_API_ACCESS_TOKENS;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        full
          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
      }`}
    >
      {count}/{MAX_AGENT_API_ACCESS_TOKENS} tokens
    </span>
  );
}

export function AdminApiKeysProductPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [tokensByAgent, setTokensByAgent] = useState<Record<string, AgentApiAccessToken[]>>({});
  const [loadingTokens, setLoadingTokens] = useState<Record<string, boolean>>({});

  const [tokenModalAgent, setTokenModalAgent] = useState<Agent | null>(null);
  const [name, setName] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [expires, setExpires] = useState<Date | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    agent: Agent;
    token: AgentApiAccessToken;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [rowError, setRowError] = useState<Record<string, string | null>>({});
  const [copySubmitting, setCopySubmitting] = useState<Record<string, boolean>>({});

  const loadAgents = useCallback(async () => {
    setListError(null);
    const data = await listAgents();
    setAgents(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadAgents()
      .catch((e: unknown) => {
        if (!cancelled) setListError(getRequestErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAgents]);

  const loadTokensFor = useCallback(async (agentId: string) => {
    setLoadingTokens((m) => ({ ...m, [agentId]: true }));
    try {
      const list = await listAgentApiAccessTokens(agentId);
      setTokensByAgent((m) => ({ ...m, [agentId]: list }));
    } catch (e: unknown) {
      setRowError((m) => ({ ...m, [agentId]: getRequestErrorMessage(e) }));
    } finally {
      setLoadingTokens((m) => ({ ...m, [agentId]: false }));
    }
  }, []);

  useEffect(() => {
    for (const a of agents) {
      void loadTokensFor(a.agentId);
    }
  }, [agents, loadTokensFor]);

  const openTokenModal = (agent: Agent) => {
    setTokenModalAgent(agent);
    setName('');
    setNoExpiry(false);
    setExpires(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const closeTokenModal = () => {
    if (submitting) return;
    setTokenModalAgent(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const onSubmitTokenForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!tokenModalAgent) return;
    const nameTrim = name.trim();
    if (!nameTrim) {
      setFormError('Name is required.');
      return;
    }
    const existingForAgent = tokensByAgent[tokenModalAgent.agentId] ?? [];
    if (existingForAgent.some((t) => t.name.trim() === nameTrim)) {
      setFormError('A token with this name already exists for this assistant.');
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      let expiresAt: string | null | undefined;
      if (noExpiry) {
        expiresAt = null;
      } else {
        if (!expires) {
          expiresAt = null;
        } else {
          expiresAt = expires.toISOString();
        }
      }
      await createAgentApiAccessToken(tokenModalAgent.agentId, { name: nameTrim, expiresAt });
      setFormSuccess('API access token created.');
      await loadTokensFor(tokenModalAgent.agentId);
      setName('');
      setExpires(null);
      setNoExpiry(false);
    } catch (err: unknown) {
      setFormError(getRequestErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onCopyToken = async (agentId: string, tokenId: string) => {
    const key = `${agentId}:${tokenId}`;
    setCopySubmitting((m) => ({ ...m, [key]: true }));
    setRowError((m) => ({ ...m, [agentId]: null }));
    try {
      const { token } = await revealAgentApiAccessTokenSecret(agentId, tokenId);
      await navigator.clipboard.writeText(token);
    } catch (e: unknown) {
      setRowError((m) => ({ ...m, [agentId]: getRequestErrorMessage(e) }));
    } finally {
      setCopySubmitting((m) => ({ ...m, [key]: false }));
    }
  };

  const onConfirmDeleteToken = async () => {
    if (!deleteTarget) return;
    const agentId = deleteTarget.agent.agentId;
    const tokenId = deleteTarget.token.identifier;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteAgentApiAccessToken(agentId, tokenId);
      setDeleteTarget(null);
      await loadTokensFor(agentId);
    } catch (err: unknown) {
      setDeleteError(getRequestErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white/70 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Integrations</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">API access</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Issue up to {MAX_AGENT_API_ACCESS_TOKENS} access tokens per assistant. Send the token in the{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">X-API-Key</code> header for server-side
              calls to that assistant&apos;s routes. Optional expiry, or unlimited when left blank.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        {listError && <FormFeedback variant="error" message={listError} />}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-700/80 dark:bg-slate-800/50"
              />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900/40"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No AI assistants yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create an assistant first, then return here to create API access tokens for it.
            </p>
            <Link
              to="/admin/agents"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            >
              Open AI assistants
            </Link>
          </motion.div>
        ) : (
          <motion.ul
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.06 },
              },
            }}
          >
            {agents.map((agent) => {
              const tokens = tokensByAgent[agent.agentId] ?? [];
              const loadingTok = loadingTokens[agent.agentId];
              const err = rowError[agent.agentId];
              const atLimit = tokens.length >= MAX_AGENT_API_ACCESS_TOKENS;

              return (
                <motion.li
                  key={agent.agentId}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.25 }}
                  className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{agent.name}</h2>
                    <TokenCountBadge count={tokens.length} />
                  </div>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                    {agent.description?.trim() || (
                      <span className="italic text-slate-400 dark:text-slate-500">No description</span>
                    )}
                  </p>
                  {err ? (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{err}</p>
                  ) : null}
                  {loadingTok ? (
                    <p className="mt-3 text-xs text-slate-500">Loading tokens…</p>
                  ) : (
                    <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {tokens.length === 0 ? (
                        <li className="text-xs text-slate-500 dark:text-slate-400">No tokens yet.</li>
                      ) : (
                        tokens.map((t) => {
                          const ck = `${agent.agentId}:${t.identifier}`;
                          return (
                            <li
                              key={t.identifier}
                              className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400 sm:flex-row sm:items-start sm:justify-between sm:gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-200">{t.name}</p>
                                <p className="text-slate-500 dark:text-slate-500">
                                  {t.tokenPrefix}… · {formatExpiry(t.expiresAt)}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={copySubmitting[ck]}
                                  aria-label={
                                    copySubmitting[ck]
                                      ? 'Copying token…'
                                      : 'Copy full token to clipboard'
                                  }
                                  title="Copy full token to clipboard"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10 disabled:opacity-50 dark:hover:bg-primary/15"
                                  onClick={() => void onCopyToken(agent.agentId, t.identifier)}
                                >
                                  {copySubmitting[ck] ? (
                                    <svg
                                      className="h-4 w-4 animate-spin"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      aria-hidden
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden
                                    >
                                      <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  aria-label="Revoke token"
                                  title="Revoke token"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget({ agent, token: t });
                                  }}
                                >
                                  <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.75}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                  >
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Button
                      type="button"
                      className="text-sm shadow-sm shadow-primary/15"
                      disabled={atLimit}
                      onClick={() => openTokenModal(agent)}
                    >
                      {atLimit ? `Max ${MAX_AGENT_API_ACCESS_TOKENS} tokens` : 'New token'}
                    </Button>
                    <Link
                      to="/admin/agents"
                      className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium !bg-slate-200 !text-slate-800 transition hover:!bg-slate-300 dark:!bg-slate-700 dark:!text-slate-200 dark:hover:!bg-slate-600"
                    >
                      Assistant
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {tokenModalAgent && (
            <motion.div
              className="fixed inset-0 z-[100] flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
                aria-label="Close dialog"
                onClick={closeTokenModal}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="api-token-form-title"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                className="relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l border-slate-200/90 bg-white shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.2)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.45)] md:max-w-[50vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                  <h2
                    id="api-token-form-title"
                    className="text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    New API access token
                  </h2>
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label="Close"
                    onClick={closeTokenModal}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    Assistant:{' '}
                    <span className="font-medium text-slate-900 dark:text-slate-100">{tokenModalAgent.name}</span>
                  </p>
                  <form className="flex min-h-min flex-col gap-4" onSubmit={onSubmitTokenForm}>
                    <Input name="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                    <div className="rounded-xl border border-slate-200/90 px-3 py-2.5 dark:border-slate-600">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={noExpiry}
                          onChange={(e) => setNoExpiry(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">No expiry (unlimited)</span>
                      </label>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        When unchecked, set an expiry date below, or leave the date empty for unlimited.
                      </p>
                    </div>
                    {!noExpiry ? (
                      <DateTimePickerField
                        id="token-expires-at"
                        label="Expires at"
                        value={expires}
                        onChange={setExpires}
                      />
                    ) : null}
                    <FormFeedback variant="error" message={formError} />
                    <FormFeedback variant="success" message={formSuccess} />
                    <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={closeTokenModal}
                        disabled={submitting}
                        className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Creating…' : 'Create token'}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {createPortal(
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={() => !deleteSubmitting && setDeleteTarget(null)}
              />
              <motion.div
                role="alertdialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revoke this API token?</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{deleteTarget.token.name}</span> for{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">{deleteTarget.agent.name}</span> will
                  stop working for integrations that use it.
                </p>
                {deleteError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={deleteSubmitting}
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </Button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                    onClick={() => void onConfirmDeleteToken()}
                  >
                    {deleteSubmitting ? 'Revoking…' : 'Revoke token'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
