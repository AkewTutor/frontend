import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';

export type RescheduleClassification = 'FREE_RESCHEDULE' | 'SAME_DAY_MISS';

export interface RescheduleResponse {
  id: string;
  sessionId: string;
  requestedNewStart: string;
  noticeHours: string;
  classification: RescheduleClassification;
  freeReschedulesUsedThisMonth?: number;
  sessionMissId?: string;
}

export function useRequestReschedule(): UseMutationResult<
  RescheduleResponse,
  AxiosError,
  { sessionId: string; requestedNewStart: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) =>
      api.post<RescheduleResponse>('/reschedule', variables).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSION_DETAIL, variables.sessionId] });
    },
  });
}
