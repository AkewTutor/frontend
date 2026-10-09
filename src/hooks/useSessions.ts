import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { ScheduledSession, SessionStatus } from '@/types';

export type SessionListItem = Pick<
  ScheduledSession,
  'id' | 'cohortId' | 'scheduledStart' | 'scheduledEnd' | 'status' | 'isMakeup' | 'recordingStatus'
>;

export interface SessionListResponse {
  sessions: SessionListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ProvideLinkResponse {
  id: string;
  jitsiLinkUrl: string;
  jitsiLinkSentAt: string;
  providedLateNotice: boolean;
}

export interface CompleteSessionResponse {
  id: string;
  status: SessionStatus;
}

export function useUpcomingSessions(params?: {
  studentId?: string;
  status?: SessionStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.SESSIONS, params],
    queryFn: () => api.get<SessionListResponse>('/sessions', { params }).then((r) => r.data),
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SESSION_DETAIL, sessionId],
    queryFn: () => api.get<ScheduledSession>(`/sessions/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: 15_000,
  });
}

export function useProvideLink() {
  const queryClient = useQueryClient();
  return useMutation<ProvideLinkResponse, AxiosError, { sessionId: string; jitsiLinkUrl: string }>({
    mutationFn: ({ sessionId, jitsiLinkUrl }) =>
      api
        .post<ProvideLinkResponse>(`/sessions/${sessionId}/link`, { jitsiLinkUrl })
        .then((r) => r.data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSION_DETAIL, sessionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
    },
  });
}

export function useMarkCompleted() {
  const queryClient = useQueryClient();
  return useMutation<CompleteSessionResponse, AxiosError, { sessionId: string }>({
    mutationFn: ({ sessionId }) =>
      api.post<CompleteSessionResponse>(`/sessions/${sessionId}/complete`).then((r) => r.data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSION_DETAIL, sessionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
    },
  });
}
