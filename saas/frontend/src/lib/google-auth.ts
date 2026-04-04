/** URL d’entrée OAuth Google (backend) — navigation pleine page, pas d’en-tête X-API-Key. */
export function googleOAuthStartUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8547';
  return `${base.replace(/\/$/, '')}/api/v1.0/auth/google`;
}

export function isGoogleAuthEnabled(): boolean {
  return import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
}
