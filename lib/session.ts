import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  photoUrl?: string | null;
  latitude?: number;
  longitude?: number;
}

/*
  Roles that belong in the municipal operations console rather than the citizen
  portal. RESPONDER / RESCUE_TEAM are deliberately NOT here — they are treated as
  field users of the citizen app; move them up if they should get the console.
*/
export const STAFF_ROLES: UserRole[] = ['AUTHORITY', 'ADMIN', 'SUPER_ADMIN'];

export const isStaffRole = (role?: UserRole | null) =>
  !!role && STAFF_ROLES.includes(role);

/*
  Both apps are served from one host in production (citizen at /, console at
  /admin) but from different ports in dev. Env vars win; otherwise we derive
  from the live origin so a missing var can never strand a production user on
  localhost, and only fall back to dev ports when actually on localhost.
*/
function resolveAppUrl(envValue: string | undefined, devUrl: string, prodPath: string) {
  if (envValue) return envValue;
  if (typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return `${window.location.origin}${prodPath}`;
  }
  return devUrl;
}

export const CITIZEN_APP_URL = resolveAppUrl(
  process.env.NEXT_PUBLIC_CITIZEN_URL,
  'http://localhost:3000',
  ''
);

export const ADMIN_APP_URL = resolveAppUrl(
  process.env.NEXT_PUBLIC_ADMIN_URL,
  'http://localhost:3001/admin',
  '/admin'
);

/* The console also exposes its own sign-in at /admin/login. */
export const ADMIN_LOGIN_URL = `${ADMIN_APP_URL}/login`;

export const LOGIN_URL = `${CITIZEN_APP_URL}/login`;

/*
  Session storage.
  - The host-scoped cookie (`sajag_session`, ports are ignored) is the SOURCE OF
    TRUTH for the token. It always holds the most recently issued JWT no matter
    which app signed in, so a session handed off between the citizen portal and
    the console on the same host just works. Only the compact token lives there
    — a JSON profile would silently overflow the ~4KB cookie limit.
  - localStorage is a per-origin mirror: it caches the token and the slim user
    profile so pages render instantly, and /auth/me refreshes the profile when
    the token only arrived via the cookie.
*/
const TOKEN_KEY = 'sajag_token';
const USER_KEY = 'sajag_user';
const SESSION_COOKIE = 'sajag_session';
/* Cookies written by the pre-refactor session layer — only here so we can purge them. */
const LEGACY_TOKEN_COOKIE = TOKEN_KEY;
const LEGACY_USER_COOKIE = USER_KEY;

/** Tokens minted for the offline demo session are never submitted to /auth/me. */
export const isDemoToken = (token: string | null | undefined) =>
  !!token && token.startsWith('demo-');

/** Placeholder until /auth/me fills in the real profile. */
export const MINIMAL_USER: SessionUser = {
  id: 'pending',
  name: '',
  phone: '',
  role: 'CITIZEN'
};

function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/** Remove cookies from the pre-refactor session scheme (no longer read). */
function purgeLegacyCookies() {
  clearCookie(LEGACY_TOKEN_COOKIE);
  clearCookie(LEGACY_USER_COOKIE);
}

function mirrorToLocalStorage(token: string, rawUser: string | null) {
  localStorage.setItem(TOKEN_KEY, token);
  if (rawUser) localStorage.setItem(USER_KEY, rawUser);
}

export function saveSession(user: SessionUser, token: string) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Shared, host-scoped, token-only. The sibling app on the same host picks the
  // session up by reading this cookie on its first hydrate. Offline demo tokens
  // stay local — they are client-side only and must not leak to the other app.
  if (!isDemoToken(token)) writeCookie(SESSION_COOKIE, token);
  purgeLegacyCookies();
}

export function loadSession(): { user: SessionUser; token: string } | null {
  if (typeof window === 'undefined') return null;

  // Cookie wins: it carries the most recent JWT regardless of which origin last
  // signed in. localStorage is only a fallback if the cookie was never set.
  const token = readCookie(SESSION_COOKIE) ?? localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (rawUser) {
    mirrorToLocalStorage(token, rawUser);
    try {
      return { user: JSON.parse(rawUser) as SessionUser, token };
    } catch {
      /* fall through to pending profile; /auth/me fills it in */
    }
  }
  return { user: MINIMAL_USER, token };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return readCookie(SESSION_COOKIE) ?? localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(SESSION_COOKIE);
  purgeLegacyCookies();
}

/** Where this user belongs after signing in. */
export function homeUrlForRole(role?: UserRole | null) {
  return isStaffRole(role) ? ADMIN_APP_URL : CITIZEN_APP_URL;
}