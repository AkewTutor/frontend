import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import type {
  SessionMissListResponse,
  RecordSessionMissBody,
  RecordSessionMissResult,
} from '@/types';

export interface UseSessionMissesParams {
  page?: number;
  limit?: number;
  tutorId?: string;
  causedBy?: string;
  sessionId?: string;
}

export function useSessionMisses(
  params?: UseSessionMissesParams
): UseQueryResult<SessionMissListResponse, AxiosError> {
  return useQuery({
    queryKey: [QUERY_KEYS.SESSION_MISSES, params],
    queryFn: () =>
      api.get<SessionMissListResponse>('/session-miss', { params }).then((r) => r.data),
  });
}

export function useRecordSessionMiss(): UseMutationResult<
  RecordSessionMissResult,
  AxiosError,
  RecordSessionMissBody
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) =>
      api.post<RecordSessionMissResult>('/session-miss', variables).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSION_MISSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSION_DETAIL, variables.sessionId] });
    },
    onError: (error) => {
      if (
        error.response?.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        error.message = String(error.response.data.message);
      }
    },
  });
}
