import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import { usePublishPolicy } from '@/hooks/useAdminPolicies';

vi.mock('@/lib/axios', () => ({ default: { post: vi.fn() } }));

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

describe('usePublishPolicy', () => {
  it('sends exactly { type, content } to POST /admin/policies', async () => {
    mockedApi.post.mockResolvedValue({
      data: { type: 'REFUND', version: 4, publishedAt: '2026-10-06T10:00:00Z' },
    });
    const { wrapper } = setup();

    const { result } = renderHook(() => usePublishPolicy(), { wrapper });
    result.current.mutate({ type: 'REFUND', content: '# x' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/policies', {
      type: 'REFUND',
      content: '# x',
    });
    expect(result.current.data?.version).toBe(4);
  });

  it('invalidates only the published type', async () => {
    mockedApi.post.mockResolvedValue({
      data: { type: 'REFUND', version: 4, publishedAt: '2026-10-06T10:00:00Z' },
    });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => usePublishPolicy(), { wrapper });
    result.current.mutate({ type: 'REFUND', content: '# x' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.POLICY, 'REFUND'] });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.POLICY, 'PRIVACY'] });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] });
  });

  it('does not invalidate on failure and exposes the error', async () => {
    mockedApi.post.mockRejectedValue(new Error('400'));
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => usePublishPolicy(), { wrapper });
    result.current.mutate({ type: 'TERMS', content: 'x' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).not.toHaveBeenCalled();
  });
});
