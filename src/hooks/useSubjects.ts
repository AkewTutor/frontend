import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Subject } from '@/types';

// GET /subjects. Public catalog = ACTIVE only. `includeInactive` is for the Admin Subject Management page.
// Distinct keys, both under the [SUBJECTS] prefix, so one invalidation refreshes both.
export function useSubjects(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive === true;
  return useQuery({
    queryKey: includeInactive
      ? [QUERY_KEYS.SUBJECTS, { includeInactive: true }]
      : [QUERY_KEYS.SUBJECTS],
    queryFn: () =>
      api
        .get<{ subjects: Subject[] }>('/subjects', {
          params: includeInactive ? { includeInactive: true } : undefined,
        })
        .then((r) => r.data),
  });
}

// POST /admin/subjects. 409 (duplicate name) is shown inline by the page.
export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.post<Subject>('/admin/subjects', { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.SUBJECTS] }),
  });
}

// PATCH /admin/subjects/:id. Body is exactly { isActive }: an explicit target, never a toggle.
export function useSetSubjectActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api
        .patch<{ id: string; isActive: boolean }>(`/admin/subjects/${id}`, { isActive })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.SUBJECTS] }),
  });
}
