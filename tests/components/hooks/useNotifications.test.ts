import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import { useMarkRead, useMyNotifications } from '@/hooks/useNotifications';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMyNotifications', () => {
  it('requests the list with unreadOnly, page and limit 20, and returns the payload', async () => {
    const payload = { notifications: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useMyNotifications(true, 2), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications', {
      params: { unreadOnly: true, page: 2, limit: 20 },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('defaults to all notifications, page 1', async () => {
    mockedApi.get.mockResolvedValue({
      data: { notifications: [], page: 1, limit: 20, total: 0 },
    });
    const { wrapper } = setup();

    renderHook(() => useMyNotifications(), { wrapper });

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications', {
      params: { unreadOnly: false, page: 1, limit: 20 },
    });
  });

  it('exposes an error state when the request fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();

    const { result } = renderHook(() => useMyNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useMarkRead', () => {
  it('PATCHes the notification and invalidates the notifications cache', async () => {
    mockedApi.patch.mockResolvedValue({ data: {} });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useMarkRead(), { wrapper });
    result.current.mutate('n1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith('/notifications/n1/read');
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
  });
});
