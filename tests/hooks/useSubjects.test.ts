import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useSubjects } from '@/hooks/useSubjects';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

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

describe('useSubjects', () => {
  it('public call sends no params and uses key [SUBJECTS]', async () => {
    mockedApi.get.mockResolvedValue({ data: { subjects: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useSubjects(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/subjects', { params: undefined });
    expect(qc.getQueryData([QUERY_KEYS.SUBJECTS])).toEqual({ subjects: [] });
  });

  it('admin call sends includeInactive under a distinct key', async () => {
    mockedApi.get.mockResolvedValue({ data: { subjects: [] } });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useSubjects({ includeInactive: true }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/subjects', { params: { includeInactive: true } });
    expect(qc.getQueryData([QUERY_KEYS.SUBJECTS, { includeInactive: true }])).toEqual({
      subjects: [],
    });
    expect(qc.getQueryData([QUERY_KEYS.SUBJECTS])).toBeUndefined();
  });
});
