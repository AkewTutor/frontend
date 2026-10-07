import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { useUsers } from '@/hooks/useAdminPeople';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUsers', () => {
  it('requests /admin/people with page, limit and role', async () => {
    const payload = { users: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsers(2, 'TUTOR'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/people', {
      params: { page: 2, limit: 20, role: 'TUTOR', search: undefined },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('defaults to page 1 with no role filter', async () => {
    mockedApi.get.mockResolvedValue({ data: { users: [], page: 1, limit: 20, total: 0 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/people', {
      params: { page: 1, limit: 20, role: undefined, search: undefined },
    });
  });
});
