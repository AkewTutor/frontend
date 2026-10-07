import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Cohort, CohortMember } from '@/types';

// GET /cohorts/me. Polls: groupFormationWindow.job.ts flips Cohort.status with no client action.
export function useMyCohorts(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.MY_COHORTS, studentId],
    queryFn: () =>
      api.get<{ cohorts: Cohort[] }>('/cohorts/me', { params: { studentId } }).then((r) => r.data),
    refetchInterval: 30_000,
  });
}

// GET /cohorts/:cohortId/members (name + photo only; see GroupAssignmentCard).
export function useCohortMembers(cohortId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.COHORT_MEMBERS, cohortId],
    queryFn: () =>
      api.get<{ members: CohortMember[] }>(`/cohorts/${cohortId}/members`).then((r) => r.data),
    enabled: !!cohortId,
  });
}
