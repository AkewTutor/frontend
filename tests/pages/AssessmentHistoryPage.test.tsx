import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssessmentHistoryPage from '@/pages/AssessmentHistoryPage';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentHistory } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useAssessmentQuiz');

const rows = [
  {
    attemptId: 'a1',
    studentId: 's6',
    studentName: 's6@test.local',
    studentEmail: 's6@test.local',
    cohortId: 'c1',
    quizId: 'q1',
    quizTitle: 'Week 1',
    weekStartDate: '2026-10-19T00:00:00.000Z',
    quizDeleted: false,
    score: 2,
    total: 3,
    submittedAt: '2026-10-20T10:00:00.000Z',
    supersededAt: '2026-10-21T10:00:00.000Z',
  },
  {
    attemptId: 'a2',
    studentId: 's6',
    studentName: 's6@test.local',
    studentEmail: 's6@test.local',
    cohortId: 'c1',
    quizId: 'q1',
    quizTitle: 'Week 1',
    weekStartDate: '2026-10-19T00:00:00.000Z',
    quizDeleted: true,
    score: 3,
    total: 3,
    submittedAt: '2026-10-22T10:00:00.000Z',
    supersededAt: null,
  },
];

describe('AssessmentHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAssessmentHistory).mockReturnValue({
      data: { history: rows },
      isLoading: false,
      isError: false,
    } as never);
  });

  it('admin sees a search box and every attempt grouped by student', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', id: 'a1' } } as never);
    render(createElement(AssessmentHistoryPage));
    expect(screen.getByLabelText('Search assessment history')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Reset for retry')).toBeInTheDocument();
    expect(screen.getByText(/Current \(quiz deleted\)/)).toBeInTheDocument();
  });

  it('parent has no search box and the hook is called without a search term', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'PARENT', id: 'p1' } } as never);
    render(createElement(AssessmentHistoryPage));
    expect(screen.queryByLabelText('Search assessment history')).toBeNull();
    expect(useAssessmentHistory).toHaveBeenCalledWith({ q: undefined });
  });

  it('shows an empty message when there is no history', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'PARENT', id: 'p1' } } as never);
    vi.mocked(useAssessmentHistory).mockReturnValue({
      data: { history: [] },
      isLoading: false,
      isError: false,
    } as never);
    render(createElement(AssessmentHistoryPage));
    expect(screen.getByText('No assessment history found.')).toBeInTheDocument();
  });
});