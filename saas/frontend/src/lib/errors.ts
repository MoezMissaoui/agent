import axios from 'axios';

/** Shown instead of raw 5xx bodies, network failures, or other non–end-user-safe messages. */
const SERVICE_UNAVAILABLE = 'Service temporarily unavailable';

/** Generic copy when the real message is technical (paths, HTTP verbs, status text, etc.). */
const SYSTEM_ERROR = 'System error';

function isTechnicalOrUnsafeUserMessage(text: string): boolean {
  const s = text.trim();
  if (s.length > 800) return true;
  if (/^Request failed with status code \d+$/i.test(s)) return true;
  if (/^Cannot (GET|POST|PUT|DELETE|PATCH)\s/i.test(s)) return true;
  if (/^<\!DOCTYPE\s/i.test(s) || /^<\?xml\s/i.test(s)) return true;
  return false;
}

function sanitizeUserFacingMessage(text: string): string {
  return isTechnicalOrUnsafeUserMessage(text) ? SYSTEM_ERROR : text;
}

/** Extract a readable message from an Axios / Nest error. */
export function getRequestErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status !== undefined && status >= 500 && status < 600) {
      return SERVICE_UNAVAILABLE;
    }
    if (!err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      return SERVICE_UNAVAILABLE;
    }
    const raw = err.response.data;
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (t.length === 0) return SYSTEM_ERROR;
      return sanitizeUserFacingMessage(t);
    }
    const d = raw as {
      message?: string | string[];
      error?: string;
    };
    if (typeof d.message === 'string') {
      return sanitizeUserFacingMessage(d.message);
    }
    if (Array.isArray(d.message)) {
      const joined = d.message.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join(', ');
      return sanitizeUserFacingMessage(joined);
    }
    if (typeof d.error === 'string' && d.error !== 'Forbidden') {
      return sanitizeUserFacingMessage(d.error);
    }
  }
  if (err instanceof Error) {
    return sanitizeUserFacingMessage(err.message);
  }
  return SERVICE_UNAVAILABLE;
}

/** Nest business error code (e.g. EMAIL_NOT_VERIFIED) when present in JSON. */
export function getRequestErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (typeof d.error === 'string' && d.error !== 'Forbidden') return d.error;
  }
  return undefined;
}
