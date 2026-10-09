import { renderHook, waitFor } from '@testing-library/react';
import { useSubmitAssessment, useAssessmentsForStudent } from '@/hooks/useWeeklyAssessment';
import api from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useWeeklyAssessment', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useSubmitAssessment', () => {
    it('POSTs /assessments with { cohortMembershipId, weekStartDate, scoreSummary, tutorFeedback } and returns body', async () => {
      const mockResponse = {
        id: '1',
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Good',
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useSubmitAssessment(), { wrapper });
      result.current.mutate({
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Good',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(api.post).toHaveBeenCalledWith('/assessments', {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Good',
      });
      expect(result.current.data).toEqual(mockResponse);
    });

    it('invalidates [ASSESSMENTS, cohortMembershipId] on success', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitAssessment(), { wrapper });
      result.current.mutate({
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Good',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assessments', 'cm-1'] });
      expect(toast.success).toHaveBeenCalledWith('Assessment submitted successfully.');
    });

    it('Handle 409 "An assessment for this week has already been submitted" with an error toast', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409 } });

      const { result } = renderHook(() => useSubmitAssessment(), { wrapper });
      result.current.mutate({
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Good',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith(
        'An assessment for this week has already been submitted'
      );
    });
  });

  describe('useAssessmentsForStudent', () => {
    it('GETs /assessments/cohort-membership/:id and returns data', async () => {
      const mockResponse = { assessments: [] };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAssessmentsForStudent('cm-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.get).toHaveBeenCalledWith('/assessments/cohort-membership/cm-1');
      expect(result.current.data).toEqual(mockResponse);
    });

    it('is not enabled if cohortMembershipId is missing', () => {
      const { result } = renderHook(() => useAssessmentsForStudent(), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
      expect(api.get).not.toHaveBeenCalled();
    });
  });
});
