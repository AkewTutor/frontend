import { useQuery, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type {
  ComplaintCategory,
  ComplaintDetail,
  ComplaintStatus,
  ComplaintSummary,
  SupportContact,
} from '@/types';

export interface MyComplaintsResponse {
  complaints: ComplaintSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface FileComplaintInput {
  category: ComplaintCategory;
  description: string;
  relatedCohortId?: string;
  relatedSessionId?: string;
  relatedPaymentId?: string;
}

// No cache invalidation here: the host page navigates to /complaints, where
// useMyComplaints refetches on mount.
export function useFileComplaint() {
  return useMutation<ComplaintSummary, AxiosError, FileComplaintInput>({
    mutationFn: (body) => api.post<ComplaintSummary>('/complaints', body).then((r) => r.data),
  });
}

export function useMyComplaints(status?: ComplaintStatus, page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.MY_COMPLAINTS, status, page],
    queryFn: () =>
      api
        .get<MyComplaintsResponse>('/complaints/me', { params: { status, page } })
        .then((r) => r.data),
  });
}

export function useMyComplaintDetail(complaintId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.COMPLAINT_DETAIL, complaintId],
    queryFn: () => api.get<ComplaintDetail>(`/complaints/${complaintId}`).then((r) => r.data),
    enabled: !!complaintId,
  });
}

export function useSupportContact() {
  return useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_CONTACT],
    queryFn: () => api.get<SupportContact>('/support/contact').then((r) => r.data),
    staleTime: Infinity,
  });
}
