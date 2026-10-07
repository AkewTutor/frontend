import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AdminThreadView } from '@/types';

// GET /admin/messaging/threads/:threadId (read-only full history).
export function useReviewThread(threadId: string, page = 1) {
  return useQuery<AdminThreadView, AxiosError>({
    queryKey: [QUERY_KEYS.ADMIN_THREAD, threadId, page],
    queryFn: () =>
      api
        .get<AdminThreadView>(`/admin/messaging/threads/${threadId}`, {
          params: { page, limit: 50 },
        })
        .then((r) => r.data),
    enabled: !!threadId,
    // 404 = thread not found: a normal state, not worth retrying.
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 1,
  });
}

// POST /admin/messaging/threads/:threadId/close
export function useCloseThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, reason }: { threadId: string; reason: string }) =>
      api.post(`/admin/messaging/threads/${threadId}/close`, { reason }).then((r) => r.data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_THREAD, vars.threadId] }),
  });
}
