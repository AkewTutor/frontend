import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { PayoutsResponse } from '@/types';

export function usePayoutBatches(page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYOUTS, page],
    queryFn: () =>
      api
        .get<PayoutsResponse>('/admin/payouts', { params: { page, limit: 20 } })
        .then((r) => r.data),
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: string) =>
      api.post(`/admin/payouts/${payoutId}/mark-paid`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYOUTS] }),
  });
}
