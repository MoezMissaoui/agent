import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createChatSession,
  deleteChatSession,
  getChatSessionMessages,
  getChatStatus,
  listChatSessions,
  sendChatMessage,
  type ChatMessage,
  type ChatSessionSummary,
} from '../../api/agentChat';
import { getRequestErrorMessage } from '../../lib/errors';
import { Button } from '../ui/Button';

type Props = {
  agentId: string;
  refreshKey: number;
  /** `modal`: fills the parent container (e.g. full-screen modal). */
  layout?: 'card' | 'modal';
};

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function UserBubbleIcon() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200"
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

function AssistantBubbleIcon() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25"
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
      </svg>
    </div>
  );
}

function formatSessionLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2" aria-live="polite" aria-label="Assistant is responding">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function AgentChatPanel({ agentId, refreshKey, layout = 'card' }: Props) {
  const isModal = layout === 'modal';
  const shellGap = isModal ? 'mt-0' : 'mt-4';
  const chatSize = isModal
    ? 'min-h-0 flex-1 h-full max-h-none'
    : 'min-h-[380px] max-h-[min(72vh,620px)]';
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusError(null);
    setStatusLoading(true);
    try {
      const s = await getChatStatus(agentId);
      setChatEnabled(s.chatEnabled);
    } catch (e) {
      setStatusError(getRequestErrorMessage(e));
      setChatEnabled(false);
    } finally {
      setStatusLoading(false);
    }
  }, [agentId]);

  const loadSessions = useCallback(async () => {
    setSessionsError(null);
    setSessionsLoading(true);
    try {
      const { sessions: list } = await listChatSessions(agentId);
      setSessions(list);
      setSelectedSessionId((prev) => {
        if (prev && list.some((x) => x.sessionId === prev)) {
          return prev;
        }
        return list[0]?.sessionId ?? null;
      });
    } catch (e) {
      setSessionsError(getRequestErrorMessage(e));
      setSessions([]);
      setSelectedSessionId(null);
    } finally {
      setSessionsLoading(false);
    }
  }, [agentId]);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setMessagesLoading(true);
      setActionError(null);
      try {
        const { messages: rows } = await getChatSessionMessages(agentId, sessionId);
        setMessages(rows);
      } catch (e) {
        setActionError(getRequestErrorMessage(e));
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [agentId],
  );

  useEffect(() => {
    void loadStatus();
  }, [agentId, refreshKey, loadStatus]);

  useEffect(() => {
    if (!chatEnabled) {
      setSessions([]);
      setSelectedSessionId(null);
      setMessages([]);
      return;
    }
    void loadSessions();
  }, [agentId, chatEnabled, refreshKey, loadSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedSessionId);
  }, [agentId, selectedSessionId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesLoading, sending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const onNewSession = async () => {
    setActionError(null);
    try {
      const { sessionId } = await createChatSession(agentId);
      setSelectedSessionId(sessionId);
      setMessages([]);
      await loadSessions();
    } catch (e) {
      setActionError(getRequestErrorMessage(e));
    }
  };

  const onDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this conversation and its entire history?')) {
      return;
    }
    setActionError(null);
    setDeletingId(sessionId);
    try {
      await deleteChatSession(agentId, sessionId);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (e) {
      setActionError(getRequestErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const submitMessage = async () => {
    const text = input.trim();
    if (!text || !selectedSessionId || sending) return;
    const pendingId = `pending:${crypto.randomUUID()}`;
    const sentAt = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        messageId: pendingId,
        role: 'USER',
        content: text,
        createdAt: sentAt,
      },
    ]);
    setInput('');
    setSending(true);
    setActionError(null);
    try {
      const res = await sendChatMessage(agentId, selectedSessionId, text);
      const now = new Date().toISOString();
      setMessages((prev) => {
        const rest = prev.filter((m) => m.messageId !== pendingId);
        return [
          ...rest,
          {
            messageId: res.userMessageId,
            role: 'USER',
            content: text,
            createdAt: now,
          },
          {
            messageId: res.assistantMessageId,
            role: 'ASSISTANT',
            content: res.answer,
            createdAt: now,
          },
        ];
      });
      void loadSessions();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.messageId !== pendingId));
      setInput(text);
      setActionError(getRequestErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    void submitMessage();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  };

  const suggestionPick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  if (statusLoading) {
    return (
      <div
        className={`${shellGap} flex min-h-[200px] ${isModal ? 'flex-1' : ''} items-center justify-center ${
          isModal
            ? 'rounded-none border-0 bg-transparent dark:bg-transparent'
            : 'rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-700/80 dark:bg-slate-900/40'
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <motion.div
            className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          Loading chat…
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div
        className={`${shellGap} border border-amber-200/90 bg-amber-50/90 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-950/40 ${
          isModal ? 'rounded-xl' : 'rounded-2xl'
        }`}
      >
        <p className="text-sm text-amber-900 dark:text-amber-100">{statusError}</p>
      </div>
    );
  }

  if (!chatEnabled) {
    return (
      <div
        className={`${shellGap} overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-950/80 ${
          isModal
            ? 'flex min-h-0 flex-1 flex-col rounded-none border-0'
            : 'rounded-2xl border border-slate-200/90 dark:border-slate-700/80'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center px-6 py-10 text-center ${isModal ? 'min-h-[280px] flex-1' : 'min-h-[220px]'}`}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Chat with your knowledge base</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Chat becomes available once at least one document has finished indexing (status{' '}
            <span className="font-medium text-emerald-700 dark:text-emerald-400">READY</span>).
          </p>
        </div>
      </div>
    );
  }

  const emptySession = !selectedSessionId;
  const showEmptyHero =
    !emptySession && !messagesLoading && messages.length === 0 && !sending;

  return (
    <div
      className={`${shellGap} flex ${chatSize} flex-col overflow-hidden ${
        isModal
          ? 'rounded-none border-0 bg-transparent shadow-none dark:bg-transparent'
          : 'rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-950/50'
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <aside
          className="flex w-[min(100%,16rem)] shrink-0 flex-col border-r border-slate-200 bg-slate-50/95 dark:border-slate-800 dark:bg-slate-900/60 lg:w-72"
          aria-label="Conversations"
        >
          <div className="flex-shrink-0 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Conversations
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full !rounded-xl !px-3 !py-2 text-xs font-medium"
              onClick={() => void onNewSession()}
              disabled={sessionsLoading}
            >
              + New conversation
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <p className="px-2 py-4 text-center text-[11px] text-slate-500">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-[11px] leading-relaxed text-slate-500">
                No conversations yet. Start one to begin.
              </p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((s, i) => (
                  <li key={s.sessionId}>
                    <div
                      className={`flex items-stretch gap-0.5 overflow-hidden rounded-xl border transition ${
                        selectedSessionId === s.sessionId
                          ? 'border-primary/40 bg-primary/10 dark:bg-primary/15'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 px-2.5 py-2.5 text-left"
                        onClick={() => setSelectedSessionId(s.sessionId)}
                      >
                        <span className="block text-[11px] font-medium text-slate-800 dark:text-slate-100">
                          Conversation {sessions.length - i}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {formatSessionLabel(s.updatedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="flex w-9 shrink-0 items-center justify-center rounded-r-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        disabled={deletingId === s.sessionId}
                        aria-label="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDeleteSession(s.sessionId);
                        }}
                      >
                        {deletingId === s.sessionId ? (
                          <motion.div
                            className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {sessionsError && (
            <p className="border-b border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              {sessionsError}
            </p>
          )}

          {/* Message area */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-slate-50/80 dark:bg-slate-900/30">
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-4">
          {messagesLoading ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <TypingIndicator />
            </div>
          ) : emptySession ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-4 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Start a <strong className="font-medium text-slate-800 dark:text-slate-200">new conversation</strong> to
                begin.
              </p>
            </div>
          ) : showEmptyHero ? (
            <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 px-4 py-3 dark:bg-primary/15">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  How can I help?
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Ask anything to get started — answers use your indexed content when relevant.
                </p>
              </div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Suggestions
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                {[
                  'Can you give me a quick overview?',
                  'What are the main ideas I should know?',
                  'Explain this in simple terms.',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => suggestionPick(s)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-xs text-slate-700 transition hover:border-primary/40 hover:bg-primary/5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.messageId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${m.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {m.role === 'USER' ? <UserBubbleIcon /> : <AssistantBubbleIcon />}
                    <div
                      className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        m.role === 'USER'
                          ? 'rounded-tr-md bg-primary text-white dark:bg-primary'
                          : 'rounded-tl-md border border-slate-200/90 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <div className="flex gap-3">
                  <AssistantBubbleIcon />
                  <div className="rounded-2xl rounded-tl-md border border-slate-200/90 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-px w-full shrink-0" />
            </div>
          )}
        </div>

        {/* Composer */}
        <div
          className={`flex-shrink-0 border-t bg-white p-3 dark:bg-slate-950/90 ${
            isModal
              ? 'border-slate-200/90 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.35)]'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <form onSubmit={onSend} className={`mx-auto ${isModal ? 'max-w-4xl' : 'max-w-3xl'}`}>
            {actionError && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400">{actionError}</p>
            )}
            <div
              className={`flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-2 shadow-inner dark:border-slate-600 dark:bg-slate-900/80 ${
                isModal ? 'ring-1 ring-slate-200/60 dark:ring-slate-600/50' : ''
              }`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  selectedSessionId
                    ? 'Ask a question… (Enter to send, Shift+Enter for newline)'
                    : 'Create a conversation to start typing'
                }
                disabled={!selectedSessionId || sending}
                className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!selectedSessionId || sending || !input.trim()}
                className={`mb-0.5 flex shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                  isModal
                    ? 'h-11 w-11 min-h-[44px] min-w-[44px] shadow-lg shadow-primary/30'
                    : 'h-10 w-10 shadow-md'
                }`}
                aria-label="Send"
              >
                {sending ? (
                  <motion.div
                    className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <SendIcon className={isModal ? 'h-6 w-6 translate-x-px' : 'h-5 w-5 translate-x-px'} />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
              History is saved per conversation. Answers may be inaccurate—verify against your sources.
            </p>
          </form>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
