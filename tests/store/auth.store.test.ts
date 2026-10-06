import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types';

const mockUser: AuthUser = {
  id: 'user-123',
  role: 'STUDENT',
  email: 'student@example.com',
  phone: null,
};

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, refreshToken: null, user: null });
    localStorage.clear();
  });

  it('initial state has token, refreshToken, user all null', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setAuth sets all three fields', () => {
    useAuthStore.getState().setAuth('a', 'r', mockUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('a');
    expect(state.refreshToken).toBe('r');
    expect(state.user).toEqual(mockUser);
  });

  it('logout() sets all three back to null', () => {
    useAuthStore.getState().setAuth('a', 'r', mockUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("after setAuth, JSON.parse(localStorage.getItem('auth-storage')!).state contains token, refreshToken and the user", () => {
    useAuthStore.getState().setAuth('a', 'r', mockUser);
    const stored = JSON.parse(localStorage.getItem('auth-storage')!);
    expect(stored.state.token).toBe('a');
    expect(stored.state.refreshToken).toBe('r');
    expect(stored.state.user).toEqual(mockUser);
  });

  it('the raw persisted string does not contain the word "password"', () => {
    useAuthStore.getState().setAuth('a', 'r', mockUser);
    const raw = localStorage.getItem('auth-storage');
    expect(raw).not.toContain('password');
  });

  it('after logout, persisted state has token, refreshToken, user all null', () => {
    useAuthStore.getState().setAuth('a', 'r', mockUser);
    useAuthStore.getState().logout();
    const stored = JSON.parse(localStorage.getItem('auth-storage')!);
    expect(stored.state.token).toBeNull();
    expect(stored.state.refreshToken).toBeNull();
    expect(stored.state.user).toBeNull();
  });
});
