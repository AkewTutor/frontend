import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AdminPeopleResponse, Role } from '@/types';

// GET /admin/people (Admin). `role` and `search` are optional filters.
// `subjectId` narrows TUTOR to verified tutors ranking it and STUDENT to those waiting for it.
export function useUsers(page = 1, role?: Role, search?: string, subjectId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_PEOPLE, page, role, search, subjectId],
    queryFn: () =>
      api
        .get<AdminPeopleResponse>('/admin/people', {
          params: { page, limit: 20, role, search, subjectId },
        })
        .then((r) => r.data),
    // Keep the old suggestions on screen while the next search loads (no flicker while typing).
    placeholderData: keepPreviousData,
  });
}

export type RestrictionType = 'SUSPENDED' | 'RESTRICTED';

// POST /admin/people/:userId/suspend. Body { reason, restrictionType } (API requires restrictionType; 07 omits it).
export function useSuspendAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      restrictionType,
    }: {
      userId: string;
      reason: string;
      restrictionType: RestrictionType;
    }) =>
      api
        .post<{ userId: string; restrictionType: RestrictionType; affectedCohortIds: string[] }>(
          `/admin/people/${userId}/suspend`,
          { reason, restrictionType }
        )
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] }),
  });
}

// POST /admin/people/:userId/reactivate (no body). Sets status back to ACTIVE.
// Beyond Doc 06-api/02, which only specifies suspend.
export function useReactivateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api
        .post<{ userId: string; status: 'ACTIVE' }>(`/admin/people/${userId}/reactivate`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] }),
  });
}

// PATCH /admin/people/relationships/:id. Body { status?, permissions? }; the id is never sent in the body.
export function useEditRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status?: 'INVITED' | 'ACTIVE' | 'REVOKED';
      permissions?: Record<string, unknown>;
    }) => api.patch(`/admin/people/relationships/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PEOPLE] }),
  });
}
