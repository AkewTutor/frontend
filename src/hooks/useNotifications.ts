import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AppNotification } from '@/types';

export interface NotificationsResponse {
  notifications: AppNotification[];
  page: number;
  limit: number;
  total: number;
}

export function useMyNotifications(
  unreadOnly = false,
  page = 1,
  options?: { refetchInterval?: number }
) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, unreadOnly, page],
    queryFn: () =>
      api
        .get<NotificationsResponse>('/notifications', {
          params: { unreadOnly, page, limit: 20 },
        })
        .then((r) => r.data),
    refetchInterval: options?.refetchInterval,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] }),
  });
}
