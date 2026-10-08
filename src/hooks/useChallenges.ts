import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Challenge, ChallengeProgress } from '@/types';

export function useActiveChallenges() {
  return useQuery({
    queryKey: [QUERY_KEYS.CHALLENGES],
    queryFn: () =>
      api.get<{ challenges: Challenge[] }>('/gamification/challenges').then((r) => r.data),
  });
}

export function useMyChallengeProgress(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CHALLENGE_PROGRESS, studentId],
    queryFn: () =>
      api
        .get<{ progress: ChallengeProgress[] }>('/gamification/challenges/me', {
          params: { studentId },
        })
        .then((r) => r.data),
  });
}

// POST /admin/challenges. 400 "End time must be after start time" is shown by the page.
export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      description: string;
      period: 'WEEKLY' | 'MONTHLY';
      startsAt: string;
      endsAt: string;
      targetValue: number;
    }) => api.post<Challenge>('/admin/challenges', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.CHALLENGES] }),
  });
}
