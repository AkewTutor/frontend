import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type {
  CohortFormat,
  MatchRequest,
  TutorProfileView,
  TutorRecommendation,
  TutorSearchResult,
} from '@/types';
export interface TutorSearchFiltersValue {
  subjectId?: string;
  grade?: number;
  day?: string;
  budgetMax?: string;
}

// GET /matching/tutors/search. The API requires a subject, so this never fires without one;
// every filter change re-keys. `budgetMax` is sent as the API's `budget` param.
export function useSearchTutors(filters: TutorSearchFiltersValue) {
  return useQuery({
    queryKey: [QUERY_KEYS.TUTOR_SEARCH, filters],
    queryFn: () => {
      const { budgetMax, ...rest } = filters;
      const params = budgetMax ? { ...rest, budget: budgetMax } : rest;
      return api
        .get<{ tutors: TutorSearchResult[] }>('/matching/tutors/search', { params })
        .then((r) => r.data);
    },
    enabled: !!filters.subjectId,
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
          // True when the student has no subject and no subjects of interest to match on.
          needsProfile?: boolean;
        }>('/matching/tutors/recommendations', { params: { studentId } })
        .then((r) => r.data),
  });
}

// GET /matching/tutors/:tutorId (1-to-1 full profile; response untyped in the spec).
export function useTutorFullProfile(tutorId: string) {
  return useQuery<TutorProfileView, AxiosError>({
    queryKey: [QUERY_KEYS.TUTOR_PROFILE_VIEW, tutorId],
    queryFn: () => api.get<TutorProfileView>(`/matching/tutors/${tutorId}`).then((r) => r.data),
    enabled: !!tutorId,
    // 404 = "Tutor not found" (API doc): a normal state, not worth retrying.
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 1,
  });
}

// POST /matching/select-tutor. No invalidation: the calling page navigates, useMyCohorts refetches.
export function useSelectTutor() {
  return useMutation<
    { cohortId: string; status: string },
    AxiosError,
    { tutorId: string; studentId?: string; subjectId?: string }
  >({
    mutationFn: (body) => api.post('/matching/select-tutor', body).then((r) => r.data),
  });
}

// POST /matching/no-exact-match (UC-25, manual Path B trigger).
export function useNoExactMatch() {
  return useMutation<
    { matchRequestId: string; status: 'PENDING_ADMIN_ASSIGNMENT' },
    AxiosError,
    { studentId?: string; subjectId?: string } | undefined
  >({
    mutationFn: (body) =>
      api
        .post('/matching/no-exact-match', {
          studentId: body?.studentId,
          subjectId: body?.subjectId,
        })
        .then((r) => r.data),
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
  return useQuery<{ requests: MatchRequest[] }, AxiosError>({
    queryKey: [QUERY_KEYS.MATCH_REQUESTS],
    // The API returns the single in-progress request; the page renders a list.
    queryFn: () =>
      api.get<MatchRequest>('/matching/requests/me').then((r) => ({ requests: [r.data] })),
    refetchInterval: 30_000,
    // 404 = "No match request in progress" (API doc): a normal state, not worth retrying.
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 1,
  });
}
