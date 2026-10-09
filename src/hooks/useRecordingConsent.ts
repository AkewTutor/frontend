import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';

export interface ConsentStatusResponse {
  tutorId: string;
  studentId: string;
  tutorAcknowledgedAt: string | null;
  studentOrParentAcknowledgedAt: string | null;
  consentComplete: boolean;
}

export interface AcknowledgeConsentResponse {
  tutorId: string;
  studentId: string;
  acknowledgedByUserId: string;
  consentComplete: boolean;
}

export function useConsentStatus(params: { tutorId?: string; studentId?: string }) {
  const { tutorId, studentId } = params;
  return useQuery({
    queryKey: [QUERY_KEYS.RECORDING_CONSENT, tutorId, studentId],
    queryFn: () =>
      api
        .get<ConsentStatusResponse>('/recording-consent/status', { params: { tutorId, studentId } })
        .then((r) => r.data),
    enabled: !!(tutorId && studentId),
  });
}

export function useAcknowledgeConsent() {
  const queryClient = useQueryClient();
  return useMutation<
    AcknowledgeConsentResponse,
    AxiosError,
    { tutorId: string; studentId: string }
  >({
    mutationFn: (body) =>
      api
        .post<AcknowledgeConsentResponse>('/recording-consent/acknowledge', body)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECORDING_CONSENT] });
    },
  });
}
