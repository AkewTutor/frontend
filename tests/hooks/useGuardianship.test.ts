import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import {
  useActivateInvite,
  useAddStudent,
  useInviteGuardian,
  useMyRelationships,
  useResendInvite,
  useRevokeRelationship,
} from '@/hooks/useGuardianship';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

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

describe('useAddStudent', () => {
  it('posts and invalidates [RELATIONSHIPS]', async () => {
    mockedApi.post.mockResolvedValue({ data: { relationshipId: 'r1' } });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useAddStudent(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ grade: 3, inviteContact: 'a@b.co' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/guardianship/students', {
      grade: 3,
      inviteContact: 'a@b.co',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.RELATIONSHIPS] });
  });

  it('accepts the full grade range 1 to 12', async () => {
    mockedApi.post.mockResolvedValue({ data: { relationshipId: 'r1' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAddStudent(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ grade: 1, inviteContact: 'a@b.co' });
      await result.current.mutateAsync({ grade: 5, inviteContact: 'a@b.co' });
      await result.current.mutateAsync({ grade: 12, inviteContact: 'a@b.co' });
    });
    expect(mockedApi.post).toHaveBeenCalledTimes(3);
  });

  it.each([0, 13])('rejects grade %i before any request', async (grade) => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAddStudent(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ grade, inviteContact: 'a@b.co' })
      ).rejects.toThrow();
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('useActivateInvite', () => {
  it('posts password and termsAccepted to the token path and returns the response', async () => {
    const payload = { accessToken: 'jwt', studentId: 's1', relationshipStatus: 'ACTIVE' };
    mockedApi.post.mockResolvedValue({ data: payload });
    const { wrapper } = setup();
    const { result } = renderHook(() => useActivateInvite(), { wrapper });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync({
        token: 'tok',
        password: 'password1',
        termsAccepted: true,
      });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/guardianship/invites/tok/activate', {
      password: 'password1',
      termsAccepted: true,
    });
    expect(data).toEqual(payload);
  });

  it('surfaces a token error to the caller', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 410 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useActivateInvite(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ token: 'old', password: 'password1', termsAccepted: true })
      ).rejects.toMatchObject({ response: { status: 410 } });
    });
  });
});

describe('useResendInvite / useInviteGuardian', () => {
  it('resends by relationship id', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { wrapper } = setup();
    const { result } = renderHook(() => useResendInvite(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('r1');
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/guardianship/invites/r1/resend');
  });

  it('invites a guardian by contact and refreshes relationships', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useInviteGuardian(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ inviteContact: 'g@b.co' });
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/guardianship/guardian-invites', {
      inviteContact: 'g@b.co',
    });
    expect(spy).toHaveBeenCalled();
  });
});

describe('useMyRelationships / useRevokeRelationship', () => {
  it('lists relationships', async () => {
    mockedApi.get.mockResolvedValue({ data: { relationships: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyRelationships(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/guardianship/relationships');
  });

  it('revokes and invalidates [RELATIONSHIPS]', async () => {
    mockedApi.patch.mockResolvedValue({ data: {} });
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useRevokeRelationship(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('r1');
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/guardianship/relationships/r1/revoke');
    expect(spy).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.RELATIONSHIPS] });
  });
});
