import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { FormatPricing } from '@/types';

// The doc shows { pricing: [...] }; the real backend may return a bare array. Normalized to the documented shape.
export function useActivePricing() {
  return useQuery({
    queryKey: [QUERY_KEYS.PRICING],
    queryFn: () =>
      api.get<FormatPricing[] | { pricing: FormatPricing[] }>('/pricing').then((r) => ({
        pricing: Array.isArray(r.data) ? r.data : (r.data.pricing ?? []),
      })),
  });
}

// The API requires totalPerHour too (07 spec omitted it). Admin-side sum check is done in the form.
export function useUpdatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      format,
      ...body
    }: {
      format: FormatPricing['format'];
      pricePerStudentPerHour: string;
      totalPerHour: string;
      platformSharePerHour: string;
      tutorSharePerHour: string;
    }) => api.put(`/admin/pricing/${format}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PRICING] }),
  });
}
