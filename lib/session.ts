import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
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

export const CITIZEN_APP_URL =
  process.env.NEXT_PUBLIC_CITIZEN_URL || 'http://localhost:3000';

export const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001/admin';

/* Sign-in happens only on the citizen app; the console has no login page. */
export const LOGIN_URL = `${CITIZEN_APP_URL}/login`;

const TOKEN_KEY = 'sajag_token';
const USER_KEY = 'sajag_user';

/*
  Cookies are scoped by host and ignore the port, so one cookie on `localhost`
  is readable by the citizen app (:3000) and the ops console (:3001) alike.
  localStorage cannot do this — it is per-origin — so the cookie is what lets a
  municipal user log in on one app and arrive authenticated in the other.
*/
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

export function saveSession(user: SessionUser, token: string) {
  if (typeof window === 'undefined') return;
  const serializedUser = JSON.stringify(user);

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, serializedUser);
  writeCookie(TOKEN_KEY, token);
  writeCookie(USER_KEY, serializedUser);
}

export function loadSession(): { user: SessionUser; token: string } | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY) ?? readCookie(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY) ?? readCookie(USER_KEY);
  if (!token || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as SessionUser;
    // A session handed over by the other app arrives only in the cookie;
    // mirror it into localStorage so this origin reads it directly next time.
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, rawUser);
    return { user, token };
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) ?? readCookie(TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(TOKEN_KEY);
  clearCookie(USER_KEY);
}

/** Where this user belongs after signing in. */
export function homeUrlForRole(role?: UserRole | null) {
  return isStaffRole(role) ? ADMIN_APP_URL : CITIZEN_APP_URL;
}
