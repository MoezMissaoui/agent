import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  createAgent,
  deleteAgent,
  listAgents,
  updateAgent,
  type Agent,
} from '../../api/agents';
import { AgentChatPanel } from '../../components/agents/AgentChatPanel';
import { AgentDocumentSlot } from '../../components/agents/AgentDocumentSlot';
import { Button } from '../../components/ui/Button';
import { FormFeedback } from '../../components/ui/FormFeedback';
import { Input } from '../../components/ui/Input';
import { getRequestErrorMessage } from '../../lib/errors';

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        active
          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

type ModalMode = 'create' | 'edit' | null;

export function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [chatModalAgent, setChatModalAgent] = useState<Agent | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    const data = await listAgents();
    setAgents(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (err) {
        if (!cancelled) setListError(getRequestErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openCreate = () => {
    setEditAgent(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setFormSuccess(null);
    setModal('create');
  };

  const openEdit = (a: Agent) => {
    setEditAgent(a);
    setName(a.name);
    setDescription(a.description ?? '');
    setIsActive(a.isActive);
    setFormError(null);
    setFormSuccess(null);
    setModal('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setEditAgent(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const onSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await createAgent({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        setFormSuccess('Agent created.');
      } else if (modal === 'edit' && editAgent) {
        const payload: Parameters<typeof updateAgent>[1] = {};
        if (name.trim() !== editAgent.name) payload.name = name.trim();
        const nextDesc = description.trim();
        const prevDesc = editAgent.description ?? '';
        if (nextDesc !== prevDesc) payload.description = nextDesc;
        if (isActive !== editAgent.isActive) payload.isActive = isActive;
        if (Object.keys(payload).length === 0) {
          setFormError('No changes to save.');
          setSubmitting(false);
          return;
        }
        await updateAgent(editAgent.agentId, payload);
        setFormSuccess('Agent updated.');
      }
      await load();
      setTimeout(() => {
        closeModal();
      }, 600);
    } catch (err) {
      setFormError(getRequestErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteAgent(deleteTarget.agentId);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(getRequestErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white/70 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Data / AI</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Agents
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Create and manage assistants for your workspace. New agents start inactive; you can mark one
                Active only after at least one document has completed ingestion.
              </p>
            </div>
            <Button type="button" onClick={openCreate} className="shrink-0 shadow-md shadow-primary/20">
              New agent
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        {listError && (
          <FormFeedback variant="error" message={listError} />
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-700/80 dark:bg-slate-800/50"
              />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900/40"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No agents yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create your first agent to define name, description, and behavior scope.
            </p>
            <Button type="button" className="mt-6" onClick={openCreate}>
              Create agent
            </Button>
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
            {agents.map((a) => (
              <motion.li
                key={a.agentId}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.25 }}
                className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">
                    {a.name}
                  </h2>
                  <StatusBadge active={a.isActive} />
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {a.description?.trim() || (
                    <span className="italic text-slate-400 dark:text-slate-500">No description</span>
                  )}
                </p>
                <AgentDocumentSlot
                  agentId={a.agentId}
                  onIngestComplete={() => {
                    void load();
                    setChatRefreshKey((k) => k + 1);
                  }}
                />
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Updated {formatShortDate(a.updatedAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Button type="button" className="text-sm shadow-sm shadow-primary/15" onClick={() => setChatModalAgent(a)}>
                    Chat
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm !bg-slate-200 !text-slate-800 hover:!bg-slate-300 dark:!bg-slate-700 dark:!text-slate-200 dark:hover:!bg-slate-600"
                    onClick={() => openEdit(a)}
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-sm font-medium bg-slate-200 text-red-600 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-red-400 dark:hover:bg-slate-600"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(a);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {modal && (
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
              onClick={closeModal}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-form-dialog-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l border-slate-200/90 bg-white shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.2)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.45)] md:max-w-[50vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <h2
                  id="agent-form-dialog-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  {modal === 'create' ? 'New agent' : 'Edit agent'}
                </h2>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Close"
                  onClick={closeModal}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                <form className="flex min-h-min flex-col gap-4" onSubmit={onSubmitForm}>
                  <Input
                    name="name"
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  <div className="w-full">
                    <label
                      htmlFor="agent-description-modal"
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Description
                    </label>
                    <textarea
                      id="agent-description-modal"
                      name="description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder="Scope, tone, or mission (optional)"
                    />
                  </div>
                  {modal === 'edit' && (
                    <div className="rounded-xl border border-slate-200/90 px-3 py-2.5 dark:border-slate-600">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                      </label>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        You can turn Active on only after at least one document has finished ingestion (indexed in
                        the knowledge base).
                      </p>
                    </div>
                  )}
                  <FormFeedback variant="error" message={formError} />
                  <FormFeedback variant="success" message={formSuccess} />
                  <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeModal}
                      disabled={submitting}
                      className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving…' : modal === 'create' ? 'Create' : 'Save'}
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
          {chatModalAgent && (
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
              aria-label="Close chat"
              onClick={() => setChatModalAgent(null)}
            />
            <motion.div
              key={chatModalAgent.agentId}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-modal-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l border-slate-200/90 bg-white shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.2)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-5">
                <div className="min-w-0">
                  <h2 id="chat-modal-title" className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {chatModalAgent.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chat with your assistant</p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Close"
                  onClick={() => setChatModalAgent(null)}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-950/40">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <AgentChatPanel
                  agentId={chatModalAgent.agentId}
                  refreshKey={chatRefreshKey}
                  layout="modal"
                />
                </div>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete agent?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-800 dark:text-slate-200">{deleteTarget.name}</span>{' '}
                will be permanently removed. Linked documents and chat sessions for this agent are deleted as
                well.
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
                  onClick={onConfirmDelete}
                >
                  {deleteSubmitting ? 'Deleting…' : 'Delete'}
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
