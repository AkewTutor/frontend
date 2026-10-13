import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type {
  AdminComplaintDetail,
  ComplaintCategory,
  ComplaintStatus,
  ResolutionAction,
} from '@/types';

export interface DisputeQueueItem {
  id: string;
  reporterRole: 'STUDENT' | 'PARENT' | 'TUTOR';
  category: ComplaintCategory;
  status: ComplaintStatus;
  relatedSessionId: string | null;
  createdAt: string;
}

// One student membership the refund can be prorated against (H4 fix). Server-computed:
// refundPreviewAmount is a 2-decimal ETB string, or null when the membership has no paid
// cycle or nothing undelivered to refund.
export interface CandidateMembership {
  id: string;
  studentDisplayName: string;
  hasActivePaidCycle: boolean;
  refundPreviewAmount: string | null;
}

export interface DisputeDetail extends AdminComplaintDetail {
  candidateMemberships: CandidateMembership[];
}

export interface DisputeQueueResponse {
  complaints: DisputeQueueItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ResolveDisputeInput {
  complaintId: string;
  status: 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionAction?: ResolutionAction;
  resolutionNotes: string;
  // H4 fix: the refund amount is always server-computed, never sent by the client.
  affectedCohortMembershipId?: string;
}

export function useDisputeQueue(
  status?: ComplaintStatus,
  category?: ComplaintCategory,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: [QUERY_KEYS.DISPUTE_QUEUE, status, category, page],
    queryFn: () =>
      api
        .get<DisputeQueueResponse>('/admin/disputes', {
          params: { status, category, page, limit },
        })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useReviewDispute(complaintId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.DISPUTE_DETAIL, complaintId],
    queryFn: () => api.get<DisputeDetail>(`/admin/disputes/${complaintId}`).then((r) => r.data),
    enabled: !!complaintId,
  });
}

// Invalidates only the queue and the open detail. Refunds, payouts, admin-people and
// tutor-profile are deliberately NOT invalidated here (8-8: no hidden cross-feature coupling).
export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation<AdminComplaintDetail, AxiosError, ResolveDisputeInput>({
    mutationFn: ({ complaintId, ...body }) =>
      api.patch<AdminComplaintDetail>(`/admin/disputes/${complaintId}`, body).then((r) => r.data),
    onSuccess: (_data, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DISPUTE_QUEUE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DISPUTE_DETAIL, complaintId] });
    },
  });
}
