import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** Sets all three fields at once; partial auth state is never valid (spec 8-1). */
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  /** Clears local state only. The POST /auth/logout call lives in useLogout (P1.3). */
  logout: () => void;
}

/**
 * SECURITY NOTE: this store persists to localStorage (via the `persist`
 * middleware below), so the access token AND refresh token are readable by any
 * JS running on the page, including injected scripts if the app is ever
 * vulnerable to XSS. This matches the documented pattern (spec 8-1, conventions
 * s0.3) and is a conscious tradeoff. The alternative is httpOnly cookies set by
 * the backend, which needs backend cookie support and CSRF protection.
 * A password is never stored client-side.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
