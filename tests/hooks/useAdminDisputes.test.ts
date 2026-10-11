import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { ResolutionAction } from '@/types';
import { useDisputeQueue, useReviewDispute, useResolveDispute } from '@/hooks/useAdminDisputes';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));

const get = vi.mocked(api.get);
const patch = vi.mocked(api.patch);

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapper(client: QueryClient = makeClient()) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDisputeQueue', () => {
  it('GET /admin/disputes, key [QUERY_KEYS.DISPUTE_QUEUE, status, category, page], refetchInterval: 30000', async () => {
    get.mockResolvedValue({ data: { complaints: [], page: 1, limit: 20, total: 0 } });
    const client = makeClient();
    const { result } = renderHook(() => useDisputeQueue('OPEN', 'SESSION_ISSUE', 1, 20), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/admin/disputes', {
      params: { status: 'OPEN', category: 'SESSION_ISSUE', page: 1, limit: 20 },
    });

    const query = client
      .getQueryCache()
      .find({ queryKey: [QUERY_KEYS.DISPUTE_QUEUE, 'OPEN', 'SESSION_ISSUE', 1] });
    expect(query).toBeDefined();
    expect(query?.observers[0]?.options.refetchInterval).toBe(30_000);
  });
});

describe('useReviewDispute', () => {
  it('GET /admin/disputes/:id, key [QUERY_KEYS.DISPUTE_DETAIL, complaintId], enabled: !!complaintId', async () => {
    get.mockResolvedValue({ data: { id: 'c1' } });
    const client = makeClient();
    const { result } = renderHook(() => useReviewDispute('c1'), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/admin/disputes/c1');
    expect(
      client.getQueryCache().find({ queryKey: [QUERY_KEYS.DISPUTE_DETAIL, 'c1'] })
    ).toBeDefined();
  });

  it('enabled: false with complaintId: null', async () => {
    renderHook(() => useReviewDispute(null), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('useResolveDispute', () => {
  it('Success invalidates both [DISPUTE_QUEUE] and [DISPUTE_DETAIL, complaintId]', async () => {
    patch.mockResolvedValue({ data: { id: 'c1', status: 'RESOLVED' } });
    const client = makeClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useResolveDispute(), { wrapper: wrapper(client) });

    await act(async () => {
      await result.current.mutateAsync({
        complaintId: 'c1',
        status: 'RESOLVED',
        resolutionAction: 'NO_ACTION',
        resolutionNotes: 'No further action needed.',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.DISPUTE_QUEUE] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.DISPUTE_DETAIL, 'c1'] });
  });

  it('Never separately invalidates [REFUNDS], [PAYOUTS], [ADMIN_PEOPLE], or [TUTOR_PROFILE]', async () => {
    patch.mockResolvedValue({ data: { id: 'c1', status: 'RESOLVED' } });
    const actions: ResolutionAction[] = ['REFUND_ISSUED', 'TUTOR_SUSPENDED'];

    for (const resolutionAction of actions) {
      const client = makeClient();
      const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
      const { result } = renderHook(() => useResolveDispute(), { wrapper: wrapper(client) });

      await act(async () => {
        await result.current.mutateAsync({
          complaintId: 'c1',
          status: 'RESOLVED',
          resolutionAction,
          resolutionNotes: 'Resolved by admin.',
          affectedCohortMembershipId: 'm1',
        });
      });

      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.REFUNDS] });
      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.PAYOUTS] });
      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] });
      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] });
    }
  });

  it('affectedCohortMembershipId replaces a free-text refundAmount (H4 fix)', async () => {
    patch.mockResolvedValue({ data: { id: 'c1', status: 'RESOLVED' } });
    const { result } = renderHook(() => useResolveDispute(), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        complaintId: 'c1',
        status: 'RESOLVED',
        resolutionAction: 'REFUND_ISSUED',
        resolutionNotes: 'Refund approved.',
        affectedCohortMembershipId: 'm1',
      });
    });

    const [url, body] = patch.mock.calls[0];
    expect(url).toBe('/admin/disputes/c1');
    expect(body).toMatchObject({ affectedCohortMembershipId: 'm1' });
    expect(body).not.toHaveProperty('refundAmount');
  });
});
