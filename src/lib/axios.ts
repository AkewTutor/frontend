import axios from 'axios';
import { env } from '@/config/env';
import type { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // malformed storage, skip attaching token
    }
  }
  return config;
});

// Response interceptor — unwrap the backend's SuccessResponse envelope,
// and handle 401 globally
api.interceptors.response.use(
  (response) => {
    // Backend always responds with { statusCode, success, message, data }.
    // Unwrap here once so every caller can keep doing `res.data` and get
    // the actual payload, not the envelope.
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
