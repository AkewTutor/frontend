import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { ActivePromotion, CreatedPromotion } from '@/types';

// The doc shows { promotions: [...] }; the real backend may return a bare array. Normalized to the documented shape.
export function useActivePromotions() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMOTIONS],
    queryFn: () =>
      api
        .get<ActivePromotion[] | { promotions: ActivePromotion[] }>('/promotions/active')
        .then((r) => ({
          promotions: Array.isArray(r.data) ? r.data : (r.data.promotions ?? []),
        })),
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      code: string;
      discountType: 'PERCENT' | 'FIXED_ETB';
      discountValue: string;
      validFrom: string;
      validTo: string;
    }) => api.post<CreatedPromotion>('/admin/promotions', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROMOTIONS] }),
  });
}
