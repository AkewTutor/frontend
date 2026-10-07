import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { CohortFormat, MatchRequest, TutorRecommendation, TutorSearchResult } from '@/types';

export interface TutorSearchFiltersValue {
  subjectId?: string;
  grade?: number;
  day?: string;
  budgetMax?: string;
  language?: string;
}

// GET /matching/tutors/search. Never fires on an empty filter set; every filter change re-keys.
export function useSearchTutors(filters: TutorSearchFiltersValue) {
  return useQuery({
    queryKey: [QUERY_KEYS.TUTOR_SEARCH, filters],
    queryFn: () =>
      api
        .get<{ tutors: TutorSearchResult[] }>('/matching/tutors/search', { params: filters })
        .then((r) => r.data),
    enabled: Object.values(filters).some(Boolean),
  });
}

// GET /matching/tutors/recommendations. No enabled gate; an empty list is a normal success.
export function useRecommendations(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.RECOMMENDATIONS, studentId],
    queryFn: () =>
      api
        .get<{
          recommendations: TutorRecommendation[];
          matchRequestId: string;
          zeroMatchSince: string | null;
        }>('/matching/tutors/recommendations', { params: { studentId } })
        .then((r) => r.data),
  });
}

// GET /matching/tutors/:tutorId (1-to-1 full profile; response untyped in the spec).
export function useTutorFullProfile(tutorId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.TUTOR_PROFILE_VIEW, tutorId],
    queryFn: () => api.get(`/matching/tutors/${tutorId}`).then((r) => r.data),
    enabled: !!tutorId,
  });
}

// POST /matching/select-tutor. No invalidation: the calling page navigates, useMyCohorts refetches.
export function useSelectTutor() {
  return useMutation<
    { cohortId: string; status: string },
    AxiosError,
    { tutorId: string; studentId?: string }
  >({
    mutationFn: (body) => api.post('/matching/select-tutor', body).then((r) => r.data),
  });
}

// POST /matching/no-exact-match (UC-25, manual Path B trigger).
export function useNoExactMatch() {
  return useMutation<
    { matchRequestId: string; status: 'SEARCHING' },
    AxiosError,
    string | undefined
  >({
    mutationFn: (studentId) =>
      api.post('/matching/no-exact-match', { studentId }).then((r) => r.data),
  });
}

// POST /matching/group-format (fire-and-navigate to the status page).
export function useRequestGroupFormat() {
  return useMutation({
    mutationFn: (body: { format: Exclude<CohortFormat, 'ONE_TO_ONE'>; studentId?: string }) =>
      api.post('/matching/group-format', body).then((r) => r.data),
  });
}

// GET /matching/requests/me. Polls: zeroMatchEscalation/staleApproval jobs change status server-side.
export function useMyMatchRequests() {
  return useQuery({
    queryKey: [QUERY_KEYS.MATCH_REQUESTS],
    queryFn: () =>
      api.get<{ requests: MatchRequest[] }>('/matching/requests/me').then((r) => r.data),
    refetchInterval: 30_000,
  });
}
