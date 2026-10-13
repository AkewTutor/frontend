import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { RefundCase, RefundQueueResponse, RefundStatus } from '@/types';

// The doc shows { refunds, page, limit, total }; the real backend may return a bare array.
// Normalized to the documented shape.
// status omitted -> the API defaults to PENDING.
export function useRefundQueue(page = 1, status?: RefundStatus) {
  return useQuery({
    queryKey: [QUERY_KEYS.REFUNDS, page, status],
    queryFn: () =>
      api
        .get<RefundCase[] | RefundQueueResponse>('/admin/refunds', {
          params: { status, page, limit: 20 },
        })
        .then((r): RefundQueueResponse => {
          if (Array.isArray(r.data)) {
            return { refunds: r.data, page, limit: 20, total: r.data.length };
          }
          return {
            refunds: r.data.refunds ?? [],
            page: r.data.page ?? page,
            limit: r.data.limit ?? 20,
            total: r.data.total ?? r.data.refunds?.length ?? 0,
          };
        }),
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
