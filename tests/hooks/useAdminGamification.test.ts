import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useAdjustBadge,
  useAdjustStudentXP,
  useAllBadges,
  useCreateBadge,
} from '@/hooks/useAdminGamification';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { qc, invalidate, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAllBadges', () => {
  it('sends category, page and limit 20; key includes category and page', async () => {
    const data = { badges: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data });
    const { qc, wrapper } = setup();
    const { result } = renderHook(() => useAllBadges('TUTOR', 2), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/badges', {
      params: { category: 'TUTOR', page: 2, limit: 20 },
    });
    expect(qc.getQueryData([QUERY_KEYS.ADMIN_BADGES, 'TUTOR', 2])).toEqual(data);
  });

  it('defaults to page 1 with no category', async () => {
    mockedApi.get.mockResolvedValue({ data: { badges: [], page: 1, limit: 20, total: 0 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAllBadges(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/badges', {
      params: { category: undefined, page: 1, limit: 20 },
    });
  });
});

describe('useAdjustBadge', () => {
  it('PATCHes by id without badgeId in the body and invalidates [ADMIN_BADGES]', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 'b1' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useAdjustBadge(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ badgeId: 'b1', isActive: false });
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/badges/b1', { isActive: false });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_BADGES] });
  });
});

describe('useCreateBadge', () => {
  it('POSTs the body and invalidates [ADMIN_BADGES]', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'b2' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateBadge(), { wrapper });
    const body = {
      name: 'Streak',
      description: 'Five in a row',
      category: 'STUDENT' as const,
      criteriaDescription: 'Attended 5 consecutive sessions',
    };
    await act(async () => {
      await result.current.mutateAsync(body);
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/badges', body);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_BADGES] });
  });
});

describe('useAdjustStudentXP', () => {
  it('POSTs amount and note to the student path and invalidates nothing', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'x1' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useAdjustStudentXP(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ studentId: 's1', amount: -20, note: 'Correction' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/students/s1/xp-adjustments', {
      amount: -20,
      note: 'Correction',
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
