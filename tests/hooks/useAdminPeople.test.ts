import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useEditRelationship, useSuspendAccount, useUsers } from '@/hooks/useAdminPeople';

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(api);

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { invalidate, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUsers', () => {
  it('requests /admin/people with page, limit and role', async () => {
    const payload = { users: [], page: 2, limit: 20, total: 0 };
    mockedApi.get.mockResolvedValue({ data: payload });
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsers(2, 'TUTOR'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/people', {
      params: { page: 2, limit: 20, role: 'TUTOR', search: undefined },
    });
    expect(result.current.data).toEqual(payload);
  });

  it('defaults to page 1 with no role filter', async () => {
    mockedApi.get.mockResolvedValue({ data: { users: [], page: 1, limit: 20, total: 0 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/people', {
      params: { page: 1, limit: 20, role: undefined, search: undefined },
    });
  });
});

describe('useSuspendAccount', () => {
  it('POSTs { reason, restrictionType } without the userId in the body, then invalidates', async () => {
    mockedApi.post.mockResolvedValue({
      data: { userId: 'u1', restrictionType: 'SUSPENDED', affectedCohortIds: [] },
    });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSuspendAccount(), { wrapper });
    result.current.mutate({ userId: 'u1', reason: 'Policy breach', restrictionType: 'SUSPENDED' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/people/u1/suspend', {
      reason: 'Policy breach',
      restrictionType: 'SUSPENDED',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] });
  });

  it('invalidates nothing on failure', async () => {
    mockedApi.post.mockRejectedValue(new Error('Not found'));
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSuspendAccount(), { wrapper });
    result.current.mutate({ userId: 'u1', reason: 'x', restrictionType: 'RESTRICTED' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useEditRelationship', () => {
  it('PATCHes the body without the id, then invalidates', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 'r1', status: 'REVOKED', revokedById: 'a1' } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useEditRelationship(), { wrapper });
    result.current.mutate({ id: 'r1', status: 'REVOKED' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/people/relationships/r1', {
      status: 'REVOKED',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] });
  });
});
