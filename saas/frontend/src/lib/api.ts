import axios, { AxiosHeaders } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8547';
const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

if (import.meta.env.DEV && !apiKey) {
  console.warn(
    '[api] VITE_API_KEY is not set; requests to the Control Plane API will return 403.',
  );
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
  },
});

const ACCESS = 'synapse_access_token';
const REFRESH = 'synapse_refresh_token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH);
}

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const h = AxiosHeaders.from(config.headers);
    h.delete('Content-Type');
    config.headers = h;
  }
  return config;
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
