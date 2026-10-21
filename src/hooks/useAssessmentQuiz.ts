import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';

export interface QuizOption {
  text: string;
  isCorrect?: boolean; // hidden from students until they submit
}

export interface QuizQuestion {
  text: string;
  options: QuizOption[];
}

export interface QuizAttemptSummary {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  total: number;
  submittedAt: string;
}

export interface MyAttempt {
  answers: number[][];
  score: number;
  total: number;
  submittedAt: string;
}

export interface Quiz {
  id: string;
  weekStartDate: string;
  title?: string | null;
  instructions: string;
  questions: QuizQuestion[];
  attempts?: QuizAttemptSummary[]; // tutor only
  myAttempt?: MyAttempt | null; // student only
}

export interface CreateQuizPayload {
  cohortId: string;
  weekStartDate: string; // YYYY-MM-DD
  title?: string;
  instructions: string;
  questions: { text: string; options: { text: string; isCorrect: boolean }[] }[];
}

export interface SubmitAttemptPayload {
  quizId: string;
  cohortId: string;
  answers: number[][];
}

function serverMessage(error: AxiosError): string | undefined {
  return (error.response?.data as { message?: string } | undefined)?.message;
}

export function useQuizzesForCohort(cohortId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ASSESSMENTS, 'quizzes', cohortId],
    queryFn: () =>
      api.get<{ quizzes: Quiz[] }>(`/assessment-quizzes/cohort/${cohortId}`).then((r) => r.data),
    enabled: !!cohortId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation<Quiz, AxiosError, CreateQuizPayload>({
    mutationFn: (variables) => api.post<Quiz>('/assessment-quizzes', variables).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ASSESSMENTS, 'quizzes', variables.cohortId],
      });
      toast.success('Quiz created.');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('A quiz for this week has already been created');
      } else {
        toast.error(serverMessage(error) ?? 'Failed to create quiz');
      }
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, SubmitAttemptPayload>({
    mutationFn: ({ quizId, answers }) =>
      api.post(`/assessment-quizzes/${quizId}/attempts`, { answers }).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ASSESSMENTS, 'quizzes', variables.cohortId],
      });
      toast.success('Answers submitted.');
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('You have already submitted this assessment');
      } else {
        toast.error(serverMessage(error) ?? 'Failed to submit answers');
      }
    },
  });
}