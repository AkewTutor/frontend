import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
// TEMP: replaced in P1.3.
import type { LoginCredentials, LoginResponse as BaseLoginResponse } from '@/types';

type LoginResponse = BaseLoginResponse & { refreshToken: string };

export function useAuth() {
  const { token, user, setAuth, logout: clearSession } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    setAuth(data.accessToken, data.refreshToken, data.user);
    navigate(ROUTES.HOME);
  };

  const logout = () => {
    clearSession();
    navigate(ROUTES.LOGIN);
  };

  return { user, token, isAuthenticated: !!token, login, logout };
}
