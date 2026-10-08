import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useAddSlot, useMyAvailability, useRemoveSlot } from '@/hooks/useAvailability';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, spy };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMyAvailability', () => {
  it('fetches /tutors/me/availability', async () => {
    mockedApi.get.mockResolvedValue({ data: { slots: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyAvailability(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/tutors/me/availability');
    expect(result.current.data).toEqual({ slots: [] });
  });
});

describe('useAddSlot', () => {
  it('posts a recurring slot and invalidates [AVAILABILITY]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 's1' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useAddSlot(), { wrapper });
    const body = {
      dayOfWeek: 1,
      startTime: '2026-01-05T16:00:00Z',
      endTime: '2026-01-05T17:00:00Z',
      isRecurring: true,
    };
    await act(async () => {
      await result.current.mutateAsync(body);
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/tutors/me/availability', body);
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.AVAILABILITY] });
  });

  it('allows a one-off slot without dayOfWeek', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 's2' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAddSlot(), { wrapper });
    const body = {
      startTime: '2026-01-05T16:00:00Z',
      endTime: '2026-01-05T17:00:00Z',
      isRecurring: false,
    };
    await act(async () => {
      await result.current.mutateAsync(body);
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/tutors/me/availability', body);
  });
});

describe('useRemoveSlot', () => {
  it('deletes by id and invalidates [AVAILABILITY]', async () => {
    mockedApi.delete.mockResolvedValue({ data: { id: 's1', deleted: true } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useRemoveSlot(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('s1');
    });
    expect(mockedApi.delete).toHaveBeenCalledWith('/tutors/me/availability/s1');
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.AVAILABILITY] });
  });
});
