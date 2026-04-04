import axios from 'axios';

/** Extract a readable message from an Axios / Nest error. */
export function getRequestErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as {
      message?: string | string[];
      error?: string;
    };
    if (typeof d.message === 'string') return d.message;
    if (Array.isArray(d.message)) {
      return d.message.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join(', ');
    }
    if (typeof d.error === 'string' && d.error !== 'Forbidden') return d.error;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

/** Nest business error code (e.g. EMAIL_NOT_VERIFIED) when present in JSON. */
export function getRequestErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (typeof d.error === 'string' && d.error !== 'Forbidden') return d.error;
  }
  return undefined;
}
