import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useCohortMaterials,
  useUploadMaterial,
  useAdminOverrideMaterial,
} from '@/hooks/useLibrary';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const patch = vi.mocked(api.patch);

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCohortMaterials', () => {
  it('calls GET with cohortId', async () => {
    get.mockResolvedValue({ data: { materials: [] } });
    const { result } = renderHook(() => useCohortMaterials('c1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/library/cohorts/c1/materials');
  });

  it('disabled without cohortId', async () => {
    renderHook(() => useCohortMaterials(), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('useUploadMaterial', () => {
  it('posts FormData containing cohortId/title/fileType/file and invalidates', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: { id: 'm1' } });
    const { result } = renderHook(() => useUploadMaterial(), { wrapper: wrapper() });

    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    await act(() =>
      result.current.mutateAsync({ cohortId: 'c1', title: 'T1', fileType: 'PDF', file })
    );

    expect(post).toHaveBeenCalled();
    const formData = post.mock.calls[0][1] as FormData;
    expect(formData.get('cohortId')).toBe('c1');
    expect(formData.get('title')).toBe('T1');
    expect(formData.get('fileType')).toBe('PDF');
    expect(formData.get('file')).toBe(file);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, 'c1'] });
  });
});

describe('useAdminOverrideMaterial', () => {
  it('Rename sends { title } only (KEY ABSENCE)', async () => {
    patch.mockResolvedValue({ data: { id: 'm1' } });
    const { result } = renderHook(() => useAdminOverrideMaterial(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ id: 'm1', cohortId: 'c1', title: 'New Title' }));

    const body = patch.mock.calls[0][1] as never;
    expect(body).toHaveProperty('title', 'New Title');
    expect(body).not.toHaveProperty('remove');
  });

  it('Remove sends { remove: true } only (KEY ABSENCE)', async () => {
    patch.mockResolvedValue({ data: { id: 'm1' } });
    const { result } = renderHook(() => useAdminOverrideMaterial(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ id: 'm1', cohortId: 'c1', remove: true }));

    const body = patch.mock.calls[0][1] as never;
    expect(body).toHaveProperty('remove', true);
    expect(body).not.toHaveProperty('title');
  });

  it('invalidates [LIBRARY_MATERIALS, cohortId]', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    patch.mockResolvedValue({ data: { id: 'm1' } });
    const { result } = renderHook(() => useAdminOverrideMaterial(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ id: 'm1', cohortId: 'c1', title: 'T' }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.LIBRARY_MATERIALS, 'c1'] });
  });
});
