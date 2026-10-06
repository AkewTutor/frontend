import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useAdminAnnouncements';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

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

describe('useAnnouncements', () => {
  it('requests the page with limit 20 and returns the payload', async () => {
    const payload = { announcements: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useAnnouncements(2), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/announcements', {
      params: { page: 2, limit: 20 },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('defaults to page 1', async () => {
    mockedApi.get.mockResolvedValue({
      data: { announcements: [], page: 1, limit: 20, total: 0 },
    });
    const { wrapper } = setup();

    renderHook(() => useAnnouncements(), { wrapper });

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/announcements', {
      params: { page: 1, limit: 20 },
    });
  });

  it('exposes an error state when the request fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();

    const { result } = renderHook(() => useAnnouncements(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateAnnouncement', () => {
  it('POSTs the body and invalidates the announcements cache', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'a1' } });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const body = { title: 'Hi', body: 'Hello all', audienceRoles: ['STUDENT' as const] };

    const { result } = renderHook(() => useCreateAnnouncement(), { wrapper });
    result.current.mutate(body);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/announcements', body);
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] });
  });
});
