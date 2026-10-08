import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useApproveTutor,
  usePendingTutors,
  useRejectTutor,
} from '@/hooks/useAdminTutorVerification';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

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

describe('usePendingTutors', () => {
  it('requests page and limit and returns the payload', async () => {
    const payload = { tutors: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();
    const { result } = renderHook(() => usePendingTutors(2), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/tutors/pending', {
      params: { page: 2, limit: 20 },
    });
    expect(result.current.data).toEqual(payload);
  });
});

describe('useApproveTutor', () => {
  it('posts approve and invalidates [PENDING_TUTORS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 't1', verificationStatus: 'VERIFIED' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useApproveTutor(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('t1');
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/tutors/t1/approve');
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PENDING_TUTORS] });
  });
});

describe('useRejectTutor', () => {
  it('posts reason and invalidates [PENDING_TUTORS]', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useRejectTutor(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ tutorId: 't1', reason: 'Missing documents' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/tutors/t1/reject', {
      reason: 'Missing documents',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PENDING_TUTORS] });
  });

  it('allows an omitted reason', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRejectTutor(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ tutorId: 't2' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/tutors/t2/reject', { reason: undefined });
  });
});
