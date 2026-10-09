import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { RefundQueueResponse, RefundStatus } from '@/types';

// status omitted -> the API defaults to PENDING.
export function useRefundQueue(page = 1, status?: RefundStatus) {
  return useQuery({
    queryKey: [QUERY_KEYS.REFUNDS, page, status],
    queryFn: () =>
      api
        .get<RefundQueueResponse>('/admin/refunds', { params: { status, page, limit: 20 } })
        .then((r) => r.data),
  });
}

export function useApproveRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (refundId: string) =>
      api.post(`/admin/refunds/${refundId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.REFUNDS] }),
  });
}

export function useRejectRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, rejectionReason }: { refundId: string; rejectionReason: string }) =>
      api.post(`/admin/refunds/${refundId}/reject`, { rejectionReason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.REFUNDS] }),
  });
}
