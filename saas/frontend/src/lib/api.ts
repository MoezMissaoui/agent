import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8547';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
