import { useMutation, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type {
  InitiatedPayment,
  PaymentHistoryResponse,
  PaymentPauseStatus,
  PaymentRecord,
} from '@/types';

// API body is { cohortMembershipId, promotionCode? } (07 spec said cohortId).
// The caller redirects to chapaCheckoutUrl; the webhook, not the client, confirms success.
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (body: { cohortMembershipId: string; promotionCode?: string }) =>
      api.post<InitiatedPayment>('/payments/initiate', body).then((r) => r.data),
  });
}

// `studentId` is required by the API for a Parent, ignored for a Student.
// The real backend may return a bare array; normalized to the documented shape.
export function useMyPayments(page = 1, studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENT_HISTORY, page, studentId],
    queryFn: () =>
      api
        .get<PaymentRecord[] | PaymentHistoryResponse>('/payments/history', {
          params: { studentId, page, limit: 20 },
        })
        .then((r): PaymentHistoryResponse => {
          if (Array.isArray(r.data)) {
            return { payments: r.data, page, limit: 20, total: r.data.length };
          }
          return {
            payments: r.data.payments ?? [],
            page: r.data.page ?? page,
            limit: r.data.limit ?? 20,
            total: r.data.total ?? r.data.payments?.length ?? 0,
          };
        }),
  });
}

// Disabled until a cohortMembershipId is known (the API requires it).
export function usePauseStatus(cohortMembershipId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAUSE_STATUS, cohortMembershipId],
    enabled: Boolean(cohortMembershipId),
    queryFn: () =>
      api
        .get<PaymentPauseStatus>('/payment-pause/status', { params: { cohortMembershipId } })
        .then((r) => r.data),
  });
}
