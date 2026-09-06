import { create } from 'zustand';
import { UserRole } from '@/types';
import {
  clearSession,
  isStaffRole,
  loadSession,
  saveSession,
  type SessionUser
} from '@/lib/session';

export type AuthUser = SessionUser;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** False until the stored session has been read on the client. */
  isHydrated: boolean;
  isStaff: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  hydrate: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  isStaff: false,
  setAuth: (user, token) => {
    saveSession(user, token);
    set({ user, token, isAuthenticated: true, isStaff: isStaffRole(user.role), isHydrated: true });
  },
  // Called from a client effect — the store starts empty so server and client
  // render the same markup, then the stored session fills it in.
  hydrate: () => {
    const session = loadSession();
    if (!session) {
      set({ isHydrated: true });
      return;
    }
    set({
      user: session.user,
      token: session.token,
      isAuthenticated: true,
      isStaff: isStaffRole(session.user.role),
      isHydrated: true
    });
  },
  logout: () => {
    clearSession();
    set({ user: null, token: null, isAuthenticated: false, isStaff: false, isHydrated: true });
  }
}));

export type { UserRole };
