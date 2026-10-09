import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants';
import { toast } from 'sonner';

export interface WeeklyAssessment {
  id: string;
  cohortMembershipId: string;
  weekStartDate: string;
  tutorFeedback: string;
  scoreSummary?: string;
  createdAt: string;
}

export interface AssessmentsResponse {
  assessments: WeeklyAssessment[];
}

export interface SubmitAssessmentPayload {
  cohortMembershipId: string;
  weekStartDate: string; // YYYY-MM-DD
  tutorFeedback: string;
  scoreSummary?: string;
}

export function useSubmitAssessment(): UseMutationResult<
  WeeklyAssessment,
  AxiosError,
  SubmitAssessmentPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) =>
      api.post<WeeklyAssessment>('/assessments', variables).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ASSESSMENTS, variables.cohortMembershipId],
      });
      toast.success('Assessment submitted successfully.');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('An assessment for this week has already been submitted');
      } else {
        toast.error('Failed to submit assessment');
      }
    },
  });
}

export function useAssessmentsForStudent(
  cohortMembershipId?: string
): UseQueryResult<AssessmentsResponse, AxiosError> {
  return useQuery({
    queryKey: [QUERY_KEYS.ASSESSMENTS, cohortMembershipId],
    queryFn: () =>
      api
        .get<AssessmentsResponse>(`/assessments/cohort-membership/${cohortMembershipId}`)
        .then((r) => r.data),
    enabled: !!cohortMembershipId,
  });
}
