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
  supersededAt: string | null; // set when the tutor allowed a retry
}

export interface MyAttempt {
  answers: number[][];
  score: number;
  total: number;
  submittedAt: string;
}

export interface PreviousAttempt {
  score: number;
  total: number;
  submittedAt: string;
  supersededAt: string | null;
}

export interface Quiz {
  id: string;
  weekStartDate: string;
  title?: string | null;
  instructions: string;
  questions: QuizQuestion[];
  attempts?: QuizAttemptSummary[]; // tutor only
  myAttempt?: MyAttempt | null; // student only
  previousAttempts?: PreviousAttempt[]; // student only
}

export interface DraftQuestionPayload {
  text: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface CreateQuizPayload {
  cohortId: string;
  weekStartDate: string; // YYYY-MM-DD
  title?: string;
  instructions: string;
  questions: DraftQuestionPayload[];
}

export interface UpdateQuizPayload {
  quizId: string;
  cohortId: string;
  title?: string;
  instructions?: string;
  questions?: DraftQuestionPayload[]; // omitted when questions are locked
}

export interface SubmitAttemptPayload {
  quizId: string;
  cohortId: string;
  answers: number[][];
}

function serverMessage(error: AxiosError): string | undefined {
  return (error.response?.data as { message?: string } | undefined)?.message;
}

const quizzesKey = (cohortId?: string) => [QUERY_KEYS.ASSESSMENTS, 'quizzes', cohortId];

export function useQuizzesForCohort(cohortId?: string) {
  return useQuery({
    queryKey: quizzesKey(cohortId),
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
      queryClient.invalidateQueries({ queryKey: quizzesKey(variables.cohortId) });
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

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation<Quiz, AxiosError, UpdateQuizPayload>({
    mutationFn: ({ quizId, cohortId: _cohortId, ...body }) =>
      api.patch<Quiz>(`/assessment-quizzes/${quizId}`, body).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(variables.cohortId) });
      toast.success('Quiz updated.');
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? 'Failed to update quiz');
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { quizId: string; cohortId: string }>({
    mutationFn: ({ quizId }) => api.delete(`/assessment-quizzes/${quizId}`).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(variables.cohortId) });
      toast.success('Quiz deleted.');
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? 'Failed to delete quiz');
    },
  });
}

export function useResetAttempt() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { attemptId: string; cohortId: string }>({
    mutationFn: ({ attemptId }) =>
      api.post(`/assessment-quizzes/attempts/${attemptId}/reset`).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(variables.cohortId) });
      toast.success('Student can now retry. The old score is kept in history.');
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? 'Failed to reset attempt');
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, SubmitAttemptPayload>({
    mutationFn: ({ quizId, answers }) =>
      api.post(`/assessment-quizzes/${quizId}/attempts`, { answers }).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(variables.cohortId) });
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