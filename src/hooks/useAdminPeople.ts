import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AdminPeopleResponse, Role } from '@/types';

// GET /admin/people (Admin). `role` and `search` are optional filters.
export function useUsers(page = 1, role?: Role, search?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_PEOPLE, page, role, search],
    queryFn: () =>
      api
        .get<AdminPeopleResponse>('/admin/people', { params: { page, limit: 20, role, search } })
        .then((r) => r.data),
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
