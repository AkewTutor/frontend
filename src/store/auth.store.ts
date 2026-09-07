import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

/**
 * SECURITY NOTE: this store persists to localStorage (via the `persist`
 * middleware below), which means the auth token is readable by any JS
 * running on the page — including injected scripts if the app is ever
 * vulnerable to XSS. This matches the documented template pattern (simple,
 * works well for an SPA behind auth) but is a conscious tradeoff, not an
 * oversight. If stricter security is needed later, the alternative is
 * httpOnly cookies set by the backend, with the token never touching
 * client-side JS at all — that requires backend cookie support and CSRF
 * protection, which is out of scope for this template.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
