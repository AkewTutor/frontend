import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { TutorProfile, TutorSubjectRanking } from '@/types';

type EditableTutorFields = Partial<
  Omit<TutorProfile, 'id' | 'userId' | 'verificationStatus' | 'verifiedAt'>
>;

export function useMyTutorProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.TUTOR_PROFILE],
    queryFn: () => api.get<TutorProfile>('/tutors/me/profile').then((r) => r.data),
  });
}

// verificationStatus is admin-only and is never part of the edit body.
export function useUpdateTutorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditableTutorFields) =>
      api.patch<Partial<TutorProfile>>('/tutors/me/profile', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] }),
  });
}

// PUT is a full replace: 1-2 items, unique ranks. The UI also blocks a third selection.
export function useRankSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subjects: { subjectId: string; rank: 1 | 2 }[]) =>
      api
        .put<{ subjects: TutorSubjectRanking[] }>('/tutors/me/subjects', { subjects })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] }),
  });
}

// No body. onSettled: a 409 means the cached profile is stale, so refetch on success AND failure.
export function useResubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<{ id: string; verificationStatus: 'PENDING' }>('/tutors/me/resubmit-verification')
        .then((r) => r.data),
    onSettled: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.TUTOR_PROFILE] }),
  });
}
