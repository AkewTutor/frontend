import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { ComplaintCategory } from '@/types';
import {
  useFileComplaint,
  useMyComplaints,
  useMyComplaintDetail,
  useSupportContact,
} from '@/hooks/useComplaints';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapper(client: QueryClient = makeClient()) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const complaintBody: {
  category: ComplaintCategory;
  description: string;
  relatedSessionId: string;
} = {
  category: 'SESSION_ISSUE',
  description: 'The tutor joined thirty minutes late.',
  relatedSessionId: 's1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useFileComplaint', () => {
  it("No cache invalidation on success; navigation is the caller's job", async () => {
    post.mockResolvedValue({ data: { id: 'c1', category: 'SESSION_ISSUE', status: 'OPEN' } });
    const client = makeClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useFileComplaint(), { wrapper: wrapper(client) });

    await act(async () => {
      await result.current.mutateAsync(complaintBody);
    });

    expect(post).toHaveBeenCalledWith('/complaints', complaintBody);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('A 400 ("must reference a session/payment/cohort unless OTHER") is still handled as a fallback', async () => {
    const error = Object.assign(new Error('Request failed with status code 400'), {
      response: { status: 400 },
    });
    post.mockRejectedValue(error);
    const { result } = renderHook(() => useFileComplaint(), { wrapper: wrapper() });

    await act(async () => {
      await expect(result.current.mutateAsync(complaintBody)).rejects.toBe(error);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});

describe('useMyComplaints', () => {
  it('GET /complaints/me, key [QUERY_KEYS.MY_COMPLAINTS, status, page]', async () => {
    get.mockResolvedValue({ data: { complaints: [], page: 1, limit: 20, total: 0 } });
    const client = makeClient();
    const { result } = renderHook(() => useMyComplaints('OPEN', 1), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/complaints/me', { params: { status: 'OPEN', page: 1 } });
    expect(
      client.getQueryCache().find({ queryKey: [QUERY_KEYS.MY_COMPLAINTS, 'OPEN', 1] })
    ).toBeDefined();
  });
});

describe('useMyComplaintDetail', () => {
  it('GET /complaints/:id, key [QUERY_KEYS.COMPLAINT_DETAIL, complaintId], enabled: !!complaintId', async () => {
    get.mockResolvedValue({ data: { id: 'c1' } });
    const client = makeClient();
    const { result } = renderHook(() => useMyComplaintDetail('c1'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/complaints/c1');
    expect(
      client.getQueryCache().find({ queryKey: [QUERY_KEYS.COMPLAINT_DETAIL, 'c1'] })
    ).toBeDefined();
  });

  it('enabled: false with complaintId: null', async () => {
    renderHook(() => useMyComplaintDetail(null), { wrapper: wrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('useSupportContact', () => {
  it('GET /support/contact, key [QUERY_KEYS.SUPPORT_CONTACT], staleTime: Infinity', async () => {
    get.mockResolvedValue({ data: { phone: '123' } });
    const client = makeClient();
    const { result } = renderHook(() => useSupportContact(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/support/contact');

    const query = client.getQueryCache().find({ queryKey: [QUERY_KEYS.SUPPORT_CONTACT] });
    expect(query).toBeDefined();
    expect(query?.observers[0]?.options.staleTime).toBe(Infinity);
  });
});
