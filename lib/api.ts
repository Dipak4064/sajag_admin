import axios from 'axios';
import { getToken, isDemoToken } from './session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getToken();
    // Demo tokens are client-side identity only — never sent over the wire.
    if (token && !isDemoToken(token) && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/*
  Global 401 handling: an authenticated request that comes back Unauthorized has
  an expired/revoked token. Let the auth store clear the session and bounce to
  sign-in instead of leaving the console in a broken "logged in" limbo. Auth
  endpoints are exempt so stale credentials surface a clear inline error.
*/
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/quick-register', '/auth/me'];

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      const url: string = error.config?.url || '';
      const headers: Record<string, string> = error.config?.headers || {};
      const hadToken = /^Bearer\s/.test(headers.Authorization || '');
      const isAuthFlow = AUTH_ENDPOINTS.some((e) => url.includes(e));
      if (hadToken && !isAuthFlow) unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);