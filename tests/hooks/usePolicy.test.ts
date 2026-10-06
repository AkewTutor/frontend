import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { usePolicy } from '@/hooks/usePolicy';
import { QUERY_KEYS } from '@/constants';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

const get = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePolicy', () => {
  it('calls GET /policies/:type, uses key [QUERY_KEYS.POLICY, type], and returns the response body', async () => {
    const mockData = { id: '1', title: 'Terms', content: '...', type: 'TERMS' };
    get.mockResolvedValueOnce({ data: mockData });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => usePolicy('TERMS'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(get).toHaveBeenCalledWith('/policies/TERMS');
    expect(result.current.data).toEqual(mockData);
    expect(client.getQueryData([QUERY_KEYS.POLICY, 'TERMS'])).toEqual(mockData);
  });
});
