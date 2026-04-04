import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getIngestJobStatus,
  listAgentDocuments,
  uploadAgentDocument,
  type AgentDocumentRow,
  type IngestJobStatus,
} from '../../api/agentIngest';
import { MAX_DOCUMENTS_PER_AGENT } from '../../config/agentDocuments';
import { getRequestErrorMessage } from '../../lib/errors';
import { Button } from '../ui/Button';

type Phase = 'idle' | 'uploading' | 'polling' | 'error';

const POLL_MS = 1000;

type Props = {
  agentId: string;
  onIngestComplete?: () => void;
};

export function AgentDocumentSlot({ agentId, onIngestComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rows, setRows] = useState<AgentDocumentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<IngestJobStatus | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshList = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await listAgentDocuments(agentId);
      setRows(list);
    } catch (e) {
      setLoadError(getRequestErrorMessage(e));
    }
  }, [agentId]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    return () => stopPoll();
  }, [stopPoll]);

  const readyRow = rows.find((r) => r.status === 'READY');

  const pickFile = () => {
    if (phase === 'uploading' || phase === 'polling') return;
    setActionError(null);
    fileRef.current?.click();
  };

  const pollOnce = useCallback(
    async (jid: string): Promise<boolean> => {
      const st = await getIngestJobStatus(agentId, jid);
      setJobStatus(st);
      if (st.status === 'completed' || st.status === 'failed') {
        if (st.status === 'failed') {
          setActionError(st.error || 'Ingestion failed.');
          setPhase('error');
        } else {
          setPhase('idle');
        }
        await refreshList();
        onIngestComplete?.();
        return true;
      }
      return false;
    },
    [agentId, onIngestComplete, refreshList],
  );

  const startPoll = useCallback(
    (jid: string) => {
      stopPoll();
      setPhase('polling');
      void (async () => {
        try {
          const done = await pollOnce(jid);
          if (done) return;
          pollRef.current = setInterval(async () => {
            try {
              const finished = await pollOnce(jid);
              if (finished) {
                stopPoll();
              }
            } catch (e) {
              stopPoll();
              setPhase('error');
              setActionError(getRequestErrorMessage(e));
            }
          }, POLL_MS);
        } catch (e) {
          setPhase('error');
          setActionError(getRequestErrorMessage(e));
        }
      })();
    },
    [pollOnce, stopPoll],
  );

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (phase === 'uploading' || phase === 'polling') {
      setActionError('Please wait for the current ingestion to finish.');
      return;
    }

    if (MAX_DOCUMENTS_PER_AGENT < 1) return;

    setActionError(null);
    setJobStatus(null);
    setActiveFileName(file.name);
    setPhase('uploading');
    try {
      const { jobId } = await uploadAgentDocument(agentId, file);
      setJobStatus({
        jobId,
        status: 'processing',
        progress: 0,
        currentStep: 'Starting…',
        userId: '',
        agentId,
        filename: file.name,
        chunksIndexed: null,
        error: null,
      });
      startPoll(jobId);
    } catch (err) {
      setPhase('error');
      setActionError(getRequestErrorMessage(err));
    }
  };

  const showProgress = phase === 'uploading' || phase === 'polling';
  const progress = jobStatus?.progress ?? 0;
  const stepLabel =
    jobStatus?.currentStep ?? (phase === 'uploading' ? 'Uploading…' : 'Processing…');

  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-3 py-2.5 dark:border-slate-600/80 dark:bg-slate-800/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Knowledge document
        </p>
        {MAX_DOCUMENTS_PER_AGENT === 1 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">1 file (replace to change)</span>
        )}
      </div>

      {loadError && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{loadError}</p>
      )}

      {showProgress && (
        <div className="mt-3 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'tween', duration: 0.35 }}
            />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{stepLabel}</p>
          {activeFileName && (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={activeFileName}>
              {activeFileName}
            </p>
          )}
        </div>
      )}

      {!showProgress && readyRow && (
        <div className="mt-2 space-y-1">
          <p
            className="truncate text-sm font-medium text-slate-800 dark:text-slate-100"
            title={readyRow.filename}
          >
            {readyRow.filename}
          </p>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Indexed (READY)</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-500">
            {new Date(readyRow.createdAt).toLocaleString()}
          </p>
          <Button type="button" variant="ghost" className="!mt-1 !px-2 !py-1.5 text-xs" onClick={pickFile}>
            Replace document
          </Button>
        </div>
      )}

      {!showProgress && !readyRow && (
        <div className="mt-2">
          <Button type="button" variant="ghost" className="!px-2 !py-1.5 text-xs" onClick={pickFile}>
            {phase === 'error' ? 'Retry upload' : 'Add document'}
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={onFileChange}
      />

      {actionError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{actionError}</p>
      )}

      <p className="mt-2 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
        PDF or TXT — uploaded to the Data Plane for embedding (RAG). Progress updates while the job runs.
      </p>
    </div>
  );
}
