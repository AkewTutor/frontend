import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Recording } from '@/types';

export interface MyRecordingsResponse {
  recordings: Recording[];
  page: number;
  limit: number;
  total: number;
}

export interface ComplianceQueueItem {
  tutorName?: string | null;
  tutorEmail?: string | null;
  consentIncomplete?: boolean;
  consentMissingCount?: number;
  tutorName?: string | null;
  tutorEmail?: string | null;
  consentIncomplete?: boolean;
  consentMissingCount?: number;
  sessionId: string;
  cohortId: string;
  tutorId: string;
  scheduledEnd: string;
  recordingStatus: string;
}

export interface ComplianceQueueResponse {
  sessions: ComplianceQueueItem[];
  page: number;
  limit: number;
  total: number;
}

export function useMyRecordings(params?: { studentId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.RECORDINGS, params],
    queryFn: () => api.get<MyRecordingsResponse>('/recordings/me', { params }).then((r) => r.data),
  });
}

export function useSignedUrl(recordingId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [QUERY_KEYS.SIGNED_URL, recordingId],
    queryFn: () =>
      api
        .get<{ signedUrl: string }>(`/recordings/${recordingId}/signed-url`)
        .then((r) => ({ url: r.data.signedUrl }))
        .catch((err: AxiosError) => {
          if (err.response?.status === 404) {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECORDINGS] });
          }
          throw err;
        }),
    enabled: !!recordingId,
    retry: false,
  });
}

export function useKeepPermanently() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, string>({
    mutationFn: (id) => api.post(`/recordings/${id}/keep-permanently`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECORDINGS] });
    },
  });
}

export function useUploadRecording() {
  return useMutation<{ recordingId: string }, AxiosError, { sessionId: string; file: File }>({
    mutationFn: ({ sessionId, file }) => {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('file', file);
      return api
        .post<{ recordingId: string }>('/recordings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        })
        .then((r) => r.data);
    },
  });
}

export function useComplianceQueue(page: number, status?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.RECORDING_COMPLIANCE, page, status],
    queryFn: () =>
      api
        .get<ComplianceQueueResponse>('/admin/library/recording-compliance', {
          params: { page, status },
        })
        .then((r) => r.data),
    refetchInterval: 30000,
  });
}
