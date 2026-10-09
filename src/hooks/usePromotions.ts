import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { ActivePromotion, CreatedPromotion } from '@/types';

export function useActivePromotions() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROMOTIONS],
    queryFn: () =>
      api.get<{ promotions: ActivePromotion[] }>('/promotions/active').then((r) => r.data),
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
