import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import { useConsentStatus, useAcknowledgeConsent } from '@/hooks/useRecordingConsent';

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

describe('useConsentStatus', () => {
  it('calls GET /recording-consent/status with tutorId and studentId query params', async () => {
    get.mockResolvedValue({ data: { consentComplete: false } });
    const { result } = renderHook(() => useConsentStatus({ tutorId: 't1', studentId: 's1' }), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/recording-consent/status', {
      params: { tutorId: 't1', studentId: 's1' },
    });
  });

  it('enabled only when both set', async () => {
    renderHook(() => useConsentStatus({ tutorId: 't1' }), { wrapper: wrapper() });
    renderHook(() => useConsentStatus({ studentId: 's1' }), { wrapper: wrapper() });
    renderHook(() => useConsentStatus({}), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('useAcknowledgeConsent', () => {
  it('POST /recording-consent/acknowledge body {tutorId, studentId}', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    post.mockResolvedValue({ data: { consentComplete: true } });
    const { result } = renderHook(() => useAcknowledgeConsent(), { wrapper: wrapper() });

    await act(() => result.current.mutateAsync({ tutorId: 't1', studentId: 's1' }));

    expect(post).toHaveBeenCalledWith('/recording-consent/acknowledge', {
      tutorId: 't1',
      studentId: 's1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.RECORDING_CONSENT] });
  });
});
