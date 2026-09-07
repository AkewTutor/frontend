import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import type { LoginCredentials, User } from '@/types';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    setAuth(data.token, data.user);
    navigate(ROUTES.HOME);
  };

  const logout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return { user, token, isAuthenticated: !!token, login, logout };
}
