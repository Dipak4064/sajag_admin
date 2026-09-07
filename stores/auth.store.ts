import { create } from 'zustand';
import { UserRole } from '@/types';
import {
  clearSession,
  isDemoToken,
  isStaffRole,
  loadSession,
  saveSession,
  ADMIN_LOGIN_URL,
  type SessionUser
} from '@/lib/session';
import { api, onUnauthorized } from '@/lib/api';

export type AuthUser = SessionUser;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** False until the stored session has been checked on the client. */
  isHydrated: boolean;
  isStaff: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  hydrate: () => Promise<void>;
  logout: () => void;
}

/** Dedupe concurrent hydrate() calls (shell + guards both bootstrap). */
let pendingHydrate: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isStaff: false,
  setAuth: (user, token) => {
    saveSession(user, token);
    set({ user, token, isAuthenticated: true, isStaff: isStaffRole(user.role), isHydrated: true });
  },
  /*
    Professional session restore: read the stored token, then VALIDATE it against
    /auth/me before calling the session good. Invalid tokens are thrown away so a
    stale/forged session can never masquerade as logged in. Cached sessions are
    tolerated only when the backend is unreachable, so the console still works
    offline during a demo.
  */
  hydrate: () => {
    if (pendingHydrate) return pendingHydrate;

    pendingHydrate = (async () => {
      const session = loadSession();
      if (!session) {
        set({ isHydrated: true });
        return;
      }

      const { user, token } = session;

      // Offline demo sessions are client-side only and never validated remotely.
      if (isDemoToken(token)) {
        set({ user, token, isAuthenticated: true, isStaff: isStaffRole(user.role), isHydrated: true });
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const freshUser = res.data?.data?.user as AuthUser;
        saveSession(freshUser, token);
        set({
          user: freshUser,
          token,
          isAuthenticated: true,
          isStaff: isStaffRole(freshUser.role),
          isHydrated: true
        });
      } catch (err: any) {
        if (err?.response?.status === 401) {
          clearSession();
          set({ user: null, token: null, isAuthenticated: false, isStaff: false, isHydrated: true });
          return;
        }
        // Network/server failure: keep a cached profile so the console opens
        // without the backend. A token handed over via cookie has no profile
        // yet, so it cannot be restored without the API.
        if (user.id !== 'pending') {
          set({ user, token, isAuthenticated: true, isStaff: isStaffRole(user.role), isHydrated: true });
        } else {
          clearSession();
          set({ isHydrated: true });
        }
      }
    })().finally(() => {
      pendingHydrate = null;
    });

    return pendingHydrate;
  },
  logout: () => {
    clearSession();
    set({ user: null, token: null, isAuthenticated: false, isStaff: false, isHydrated: true });
  }
}));

/*
  Any 401 on an authenticated API call means the session is dead (expired,
  revoked, user removed). Clear it everywhere and return the user to sign-in.
  Login/register/me are exempt — they surface their own errors in place.
*/
onUnauthorized(() => {
  if (typeof window === 'undefined') return;
  // The console serves /admin/login (basePath "/admin"), so raw pathname checks
  // and navigations must be base-path aware — never navigate to bare '/login'.
  if (window.location.pathname.endsWith('/login')) return;
  const wasAuthed = useAuthStore.getState().isAuthenticated;
  useAuthStore.getState().logout();
  if (wasAuthed) window.location.href = ADMIN_LOGIN_URL;
});

export type { UserRole };