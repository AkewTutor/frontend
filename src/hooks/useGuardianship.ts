import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { ParentStudentRelationship } from '@/types';

// POST /guardianship/students. Full grade range 1-12 (unlike /auth/register/student, 6-12 only).
export function useAddStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { grade: number; inviteContact: string }) => {
      if (!Number.isInteger(body.grade) || body.grade < 1 || body.grade > 12) {
        return Promise.reject(new Error('Grade must be between 1 and 12'));
      }
      return api
        .post<{
          relationshipId: string;
          studentRecordStatus: string;
          relationshipType: string;
          inviteExpiresAt: string;
        }>('/guardianship/students', body)
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.RELATIONSHIPS] }),
  });
}

// Fire-and-toast: the page owns the toast.
export function useResendInvite() {
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(`/guardianship/invites/${relationshipId}/resend`).then((r) => r.data),
  });
}

// Public flow. The API response has no refreshToken/user, so this hook does NOT touch the auth store.
export function useActivateInvite() {
  return useMutation({
    mutationFn: ({
      token,
      password,
      termsAccepted,
    }: {
      token: string;
      password: string;
      termsAccepted: boolean;
    }) =>
      api
        .post<{ accessToken: string; studentId: string; relationshipStatus: string }>(
          `/guardianship/invites/${token}/activate`,
          { password, termsAccepted }
        )
        .then((r) => r.data),
  });
}

// Fire-and-toast. UC-07: a Grade 6-12 student invites an optional guardian.
export function useInviteGuardian() {
  return useMutation({
    mutationFn: (body: { email?: string; phone?: string }) =>
      api.post('/guardianship/guardian-invites', body).then((r) => r.data),
  });
}

export function useMyRelationships() {
  return useQuery({
    queryKey: [QUERY_KEYS.RELATIONSHIPS],
    queryFn: () =>
      api
        .get<{ relationships: ParentStudentRelationship[] }>('/guardianship/relationships')
        .then((r) => r.data),
  });
}

export function useRevokeRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/guardianship/relationships/${id}/revoke`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.RELATIONSHIPS] }),
  });
}
