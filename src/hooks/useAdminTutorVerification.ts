import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { PendingTutorsResponse } from '@/types';

export function usePendingTutors(page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.PENDING_TUTORS, page],
    queryFn: () =>
      api
        .get<PendingTutorsResponse>('/admin/tutors/pending', { params: { page, limit: 20 } })
        .then((r) => r.data),
  });
}

export function useApproveTutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tutorId: string) =>
      api.post(`/admin/tutors/${tutorId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_TUTORS] }),
  });
}

export function useRejectTutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tutorId, reason }: { tutorId: string; reason?: string }) =>
      api.post(`/admin/tutors/${tutorId}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_TUTORS] }),
  });
}
