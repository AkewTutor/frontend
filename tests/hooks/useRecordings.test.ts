import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useMyRecordings,
  useSignedUrl,
  useKeepPermanently,
  useUploadRecording,
  useComplianceQueue,
} from '@/hooks/useRecordings';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

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

describe('useMyRecordings', () => {
  it('calls GET /recordings/me with params', async () => {
    get.mockResolvedValue({ data: { recordings: [], page: 1, limit: 10, total: 0 } });
    const { result } = renderHook(() => useMyRecordings({ page: 1 }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/recordings/me', { params: { page: 1 } });
  });
});

describe('useSignedUrl', () => {
  it('enabled: false with recordingId: null', async () => {
    renderHook(() => useSignedUrl(null), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });

  it('retry: false is set — a 404 does not retry', async () => {
    get.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useSignedUrl('r1'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('useKeepPermanently', () => {
  it('invalidates [RECORDINGS]', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useKeepPermanently(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync('r1'));
    expect(post).toHaveBeenCalledWith('/recordings/r1/keep-permanently');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.RECORDINGS] });
  });
});

describe('useUploadRecording', () => {
  it('Builds FormData from sessionId + file', async () => {
    post.mockResolvedValue({ data: { recordingId: 'new1' } });
    const { result } = renderHook(() => useUploadRecording(), { wrapper: wrapper() });

    const file = new File([''], 'test.mp4', { type: 'video/mp4' });
    await act(() => result.current.mutateAsync({ sessionId: 's1', file }));

    expect(post).toHaveBeenCalled();
    const formData = post.mock.calls[0][1] as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('sessionId')).toBe('s1');
    expect(formData.get('file')).toBe(file);
  });

  it('No automatic [RECORDINGS] invalidation', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: { recordingId: 'new1' } });
    const { result } = renderHook(() => useUploadRecording(), { wrapper: wrapper() });

    const file = new File([''], 'test.mp4', { type: 'video/mp4' });
    await act(() => result.current.mutateAsync({ sessionId: 's1', file }));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('No client-side file-type/size validation duplicated in the hook', async () => {
    post.mockResolvedValue({ data: { recordingId: 'new1' } });
    const { result } = renderHook(() => useUploadRecording(), { wrapper: wrapper() });

    const file = new File(['x'], 'test.txt', { type: 'text/plain' });
    await act(() => result.current.mutateAsync({ sessionId: 's1', file }));

    expect(post).toHaveBeenCalled();
  });
});

describe('useComplianceQueue', () => {
  it('calls GET /admin/library/recording-compliance', async () => {
    get.mockResolvedValue({ data: { sessions: [], page: 1, limit: 10, total: 0 } });
    const { result } = renderHook(() => useComplianceQueue(1, 'MISSING'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/admin/library/recording-compliance', {
      params: { page: 1, status: 'MISSING' },
    });
  });
});
