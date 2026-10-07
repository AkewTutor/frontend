import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Message, MessagesResponse, MessageThread } from '@/types';

// 403 = "Messaging is not available for this cohort": an expected state, never worth retrying.
const retryUnlessForbidden = (failureCount: number, error: AxiosError) =>
  error.response?.status !== 403 && failureCount < 1;

// GET /messaging/cohorts/:cohortId/thread
export function useThread(cohortId: string) {
  return useQuery<MessageThread, AxiosError>({
    queryKey: [QUERY_KEYS.THREAD, cohortId],
    queryFn: () =>
      api.get<MessageThread>(`/messaging/cohorts/${cohortId}/thread`).then((r) => r.data),
    enabled: !!cohortId,
    retry: retryUnlessForbidden,
  });
}

// GET /messaging/cohorts/:cohortId/messages.
// Polls every 8s because V1 has no websocket (NOT a job-driven state). Remove the interval if a
// push channel is ever added. Polling stops after a 403 so an unavailable thread is not hit forever.
export function useMessages(cohortId: string, page = 1) {
  return useQuery<MessagesResponse, AxiosError>({
    queryKey: [QUERY_KEYS.MESSAGES, cohortId, page],
    queryFn: () =>
      api
        .get<MessagesResponse>(`/messaging/cohorts/${cohortId}/messages`, {
          params: { page, limit: 50 },
        })
        .then((r) => r.data),
    enabled: !!cohortId,
    refetchInterval: (query) => (query.state.error?.response?.status === 403 ? false : 8_000),
    retry: retryUnlessForbidden,
  });
}

// POST /messaging/cohorts/:cohortId/messages. No optimistic append; the 403 variants are
// handled by MessageComposer, not here.
export function useSendMessage(cohortId: string) {
  const qc = useQueryClient();
  return useMutation<Message, AxiosError, string>({
    mutationFn: (body) =>
      api.post<Message>(`/messaging/cohorts/${cohortId}/messages`, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, cohortId] }),
  });
}
