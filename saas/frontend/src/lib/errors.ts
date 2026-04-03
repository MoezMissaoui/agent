import axios from 'axios';

/** Extrait un message lisible depuis une erreur Axios / Nest. */
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
    if (d.error) return d.error;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
