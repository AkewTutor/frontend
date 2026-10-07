import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { CohortFormat, MatchingQueueResponse } from '@/types';

// GET /admin/matching/queue. Polls: staleApproval.job.ts flips overdue flags server-side.
export function useApprovalQueue(page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.MATCHING_QUEUE, page],
    queryFn: () =>
      api
        .get<MatchingQueueResponse>('/admin/matching/queue', { params: { page, limit: 20 } })
        .then((r) => r.data),
    refetchInterval: 20_000,
  });
}

export function useApproveCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cohortId: string) =>
      api.post(`/admin/matching/${cohortId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] }),
  });
}

export function useRejectCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cohortId, reason }: { cohortId: string; reason: string }) =>
      api.post(`/admin/matching/${cohortId}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] }),
  });
}

export function useManualAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { tutorId: string; studentIds: string[]; format: CohortFormat }) =>
      api.post('/admin/matching/manual-assign', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.MATCHING_QUEUE] }),
  });
}
