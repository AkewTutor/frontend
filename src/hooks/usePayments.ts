import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useMyCohorts } from '@/hooks/useCohort';

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

const fetchPauseStatus = (cohortMembershipId: string) =>
  api
    .get<PaymentPauseStatus>('/payment-pause/status', { params: { cohortMembershipId } })
    .then((r) => r.data);

export function usePauseStatus(cohortMembershipId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAUSE_STATUS, cohortMembershipId],
    enabled: Boolean(cohortMembershipId),
    queryFn: () => fetchPauseStatus(cohortMembershipId as string),
  });
}

// Pause state across all of the student's ACTIVE memberships (shares usePauseStatus's cache keys).
// Parent: pass studentId. Do not call for a Parent without one.
export function usePaymentPause(studentId?: string) {
  const cohorts = useMyCohorts(studentId);
  const ids = (cohorts.data?.cohorts ?? [])
    .filter((c) => c.membershipStatus === 'ACTIVE')
    .map((c) => c.cohortMembershipId);
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: [QUERY_KEYS.PAUSE_STATUS, id],
      queryFn: () => fetchPauseStatus(id),
    })),
  });
  const pauses = results.flatMap((r) => (r.data?.isPaused ? [r.data] : []));
  return {
    isLoading: cohorts.isLoading || results.some((r) => r.isLoading),
    isError: cohorts.isError || results.some((r) => r.isError),
    isPaused: pauses.length > 0,
    pauses,
  };
}
