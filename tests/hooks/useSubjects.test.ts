import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useCreateSubject, useSetSubjectActive, useSubjects } from '@/hooks/useSubjects';

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

describe('useCreateSubject', () => {
  it('POSTs { name } and invalidates the [SUBJECTS] prefix', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 's1', name: 'Chemistry', isActive: true } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateSubject(), { wrapper });
    result.current.mutate('Chemistry');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/subjects', { name: 'Chemistry' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SUBJECTS] });
  });

  it('on 409 invalidates nothing and exposes the server message', async () => {
    mockedApi.post.mockRejectedValue(new Error('A subject with this name already exists'));
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateSubject(), { wrapper });
    result.current.mutate('Maths');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('A subject with this name already exists');
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useSetSubjectActive', () => {
  it('PATCHes exactly { isActive: false } to deactivate', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 's1', isActive: false } });
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetSubjectActive(), { wrapper });
    result.current.mutate({ id: 's1', isActive: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/subjects/s1', { isActive: false });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.SUBJECTS] });
  });

  it('PATCHes { isActive: true } to reactivate', async () => {
    mockedApi.patch.mockResolvedValue({ data: { id: 's1', isActive: true } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useSetSubjectActive(), { wrapper });
    result.current.mutate({ id: 's1', isActive: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/subjects/s1', { isActive: true });
  });
});
