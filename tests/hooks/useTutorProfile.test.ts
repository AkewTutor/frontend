import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useMyTutorProfile,
  useRankSubjects,
  useResubmitVerification,
  useUpdateTutorProfile,
} from '@/hooks/useTutorProfile';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn() },
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

describe('useMyTutorProfile', () => {
  it('fetches /tutors/me/profile', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 't1', verificationStatus: 'PENDING' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyTutorProfile(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/tutors/me/profile');
    expect(result.current.data).toEqual({ id: 't1', verificationStatus: 'PENDING' });
  });
});

describe('useUpdateTutorProfile', () => {
  it('patches and invalidates [TUTOR_PROFILE]', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 't1' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useUpdateTutorProfile(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ bio: 'New bio' });
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/tutors/me/profile', { bio: 'New bio' });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] });
  });
});

describe('useRankSubjects', () => {
  it('puts the ranked subjects and invalidates [TUTOR_PROFILE]', async () => {
    mockedApi.put.mockResolvedValue({ data: { subjects: [] } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useRankSubjects(), { wrapper });
    const subjects: { subjectId: string; rank: 1 | 2 }[] = [
      { subjectId: 'a', rank: 1 },
      { subjectId: 'b', rank: 2 },
    ];
    await act(async () => {
      await result.current.mutateAsync(subjects);
    });
    expect(mockedApi.put).toHaveBeenCalledWith('/tutors/me/subjects', { subjects });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] });
  });
});

describe('useResubmitVerification', () => {
  it('posts to the right endpoint with no body', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 't1', verificationStatus: 'PENDING' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useResubmitVerification(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith('/tutors/me/resubmit-verification');
  });

  it('invalidates [TUTOR_PROFILE] on success', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 't1', verificationStatus: 'PENDING' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useResubmitVerification(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] });
  });

  it('also invalidates [TUTOR_PROFILE] on a 409 failure and exposes the error', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 409 } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useResubmitVerification(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
