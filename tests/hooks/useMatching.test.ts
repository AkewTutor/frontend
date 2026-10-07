import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import {
  useMyMatchRequests,
  useNoExactMatch,
  useRecommendations,
  useRequestGroupFormat,
  useSearchTutors,
  useSelectTutor,
  useTutorFullProfile,
  type TutorSearchFiltersValue,
} from '@/hooks/useMatching';

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

afterEach(() => {
  vi.useRealTimers();
});

describe('useSearchTutors', () => {
  it('does not fire with an empty filter set', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useSearchTutors({}), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('fires once any single filter is set', async () => {
    mockedApi.get.mockResolvedValue({ data: { tutors: [] } });
    const { wrapper } = setup();
    renderHook(() => useSearchTutors({ subjectId: 'x' }), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    expect(mockedApi.get).toHaveBeenCalledWith('/matching/tutors/search', {
      params: { subjectId: 'x' },
    });
  });

  it('fires a fresh request with the new params when a filter changes', async () => {
    mockedApi.get.mockResolvedValue({ data: { tutors: [] } });
    const { wrapper } = setup();
    const { rerender } = renderHook(
      ({ filters }: { filters: TutorSearchFiltersValue }) => useSearchTutors(filters),
      { wrapper, initialProps: { filters: { subjectId: 'x', grade: 3 } } }
    );
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    rerender({ filters: { subjectId: 'x', grade: 4 } });

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(2));
    expect(mockedApi.get).toHaveBeenLastCalledWith('/matching/tutors/search', {
      params: { subjectId: 'x', grade: 4 },
    });
  });
});

describe('useRecommendations', () => {
  it('treats an empty recommendations list as a normal success', async () => {
    const payload = { recommendations: [], matchRequestId: 'm1', zeroMatchSince: null };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();

    const { result } = renderHook(() => useRecommendations('s1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(payload);
    expect(mockedApi.get).toHaveBeenCalledWith('/matching/tutors/recommendations', {
      params: { studentId: 's1' },
    });
  });

  it('fires on mount with no enabled gate', async () => {
    mockedApi.get.mockResolvedValue({
      data: { recommendations: [], matchRequestId: 'm1', zeroMatchSince: null },
    });
    const { wrapper } = setup();
    renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
  });
});

describe('useTutorFullProfile', () => {
  it('is disabled for an empty id and fetches for a real one', async () => {
    mockedApi.get.mockResolvedValue({ data: { tutorId: 't1' } });
    const { wrapper } = setup();

    const empty = renderHook(() => useTutorFullProfile(''), { wrapper });
    expect(empty.result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();

    renderHook(() => useTutorFullProfile('t1'), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/matching/tutors/t1'));
  });
});

describe('useSelectTutor', () => {
  it('posts the body and invalidates nothing itself', async () => {
    mockedApi.post.mockResolvedValue({ data: { cohortId: 'c1', status: 'PENDING_APPROVAL' } });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useSelectTutor(), { wrapper });
    result.current.mutate({ tutorId: 't1', studentId: 's1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/matching/select-tutor', {
      tutorId: 't1',
      studentId: 's1',
    });
    expect(result.current.data).toEqual({ cohortId: 'c1', status: 'PENDING_APPROVAL' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('surfaces a 409 as an error and does not retry the stale tutor', async () => {
    const err = Object.assign(new Error('conflict'), { response: { status: 409 } });
    mockedApi.post.mockRejectedValue(err);
    const { wrapper } = setup();

    const { result } = renderHook(() => useSelectTutor(), { wrapper });
    result.current.mutate({ tutorId: 't1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(err);
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
  });
});

describe('useNoExactMatch', () => {
  it('posts the studentId and writes nothing to the cache', async () => {
    mockedApi.post.mockResolvedValue({ data: { matchRequestId: 'm1', status: 'SEARCHING' } });
    const { qc, wrapper } = setup();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useNoExactMatch(), { wrapper });
    result.current.mutate('s1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/matching/no-exact-match', { studentId: 's1' });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useRequestGroupFormat', () => {
  it('posts the chosen group format', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { wrapper } = setup();

    const { result } = renderHook(() => useRequestGroupFormat(), { wrapper });
    result.current.mutate({ format: 'ONE_TO_THREE', studentId: 's1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/matching/group-format', {
      format: 'ONE_TO_THREE',
      studentId: 's1',
    });
  });
});

describe('useMyMatchRequests', () => {
  it('polls at 30s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedApi.get.mockResolvedValue({ data: { requests: [] } });
    const { wrapper } = setup();

    renderHook(() => useMyMatchRequests(), { wrapper });
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    expect(mockedApi.get).toHaveBeenCalledWith('/matching/requests/me');

    await vi.advanceTimersByTimeAsync(30_000);

    await waitFor(() => expect(mockedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
