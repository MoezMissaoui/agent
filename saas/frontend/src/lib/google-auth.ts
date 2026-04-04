/** Google OAuth entry URL (backend) — full-page navigation, no X-API-Key header. */
export function googleOAuthStartUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8547';
  return `${base.replace(/\/$/, '')}/api/v1.0/auth/google`;
}

export function isGoogleAuthEnabled(): boolean {
  return import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
}
