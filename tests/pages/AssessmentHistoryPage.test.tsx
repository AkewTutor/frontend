import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssessmentHistoryPage from '@/pages/AssessmentHistoryPage';
import { useAuth } from '@/hooks/useAuth';
import { useAssessmentHistory, type AssessmentHistoryRow } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useAssessmentQuiz');

function row(over: Partial<AssessmentHistoryRow>): AssessmentHistoryRow {
  return {
    attemptId: 'a1',
    studentId: 's6',
    studentName: 's6@test.local',
    studentEmail: 's6@test.local',
    tutorName: 'Abel Tesfaye',
    tutorEmail: 't3@test.local',
    cohortId: 'c1',
    quizId: 'q1',
    quizTitle: 'Week 1',
    weekStartDate: '2026-10-19T00:00:00.000Z',
    quizDeleted: false,
    score: 2,
    total: 3,
    submittedAt: '2026-10-20T10:00:00.000Z',
    supersededAt: null,
    ...over,
  };
}

function mockHistory(history: AssessmentHistoryRow[]) {
  vi.mocked(useAssessmentHistory).mockReturnValue({
    data: { history },
    isLoading: false,
    isError: false,
  } as never);
}

describe('AssessmentHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', id: 'a1' } } as never);
  });

  it('lists students collapsed and opens the history on click', () => {
    mockHistory([
      row({ attemptId: 'a1', score: 3, supersededAt: null, quizDeleted: true }),
      row({ attemptId: 'a2', score: 2, supersededAt: '2026-10-21T10:00:00.000Z' }),
    ]);
    render(createElement(AssessmentHistoryPage));

    const header = screen.getByRole('button', { name: /s6@test.local/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveTextContent('2 attempts');
    expect(screen.queryByText('Reset for retry')).toBeNull();

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Reset for retry')).toBeInTheDocument();
    expect(screen.getByText(/Current \(quiz deleted\)/)).toBeInTheDocument();
    expect(screen.getAllByText('Abel Tesfaye')).toHaveLength(2);

    fireEvent.click(header);
    expect(screen.queryByText('Reset for retry')).toBeNull();
  });

  it('sorts students A to Z by name or email', () => {
    mockHistory([
      row({ attemptId: 'a1', studentId: 'b', studentName: 'b@test.local', studentEmail: 'b@test.local' }),
      row({ attemptId: 'a2', studentId: 'a', studentName: 'Amara', studentEmail: 'amara@test.local' }),
      row({ attemptId: 'a3', studentId: 'c', studentName: 'c@test.local', studentEmail: 'c@test.local' }),
    ]);
    render(createElement(AssessmentHistoryPage));
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Amara');
    expect(buttons[1]).toHaveTextContent('b@test.local');
    expect(buttons[2]).toHaveTextContent('c@test.local');
  });

  it('shows the tutor email under the name', () => {
    mockHistory([row({})]);
    render(createElement(AssessmentHistoryPage));
    fireEvent.click(screen.getByRole('button', { name: /s6@test.local/ }));
    expect(screen.getByText('t3@test.local')).toBeInTheDocument();
  });

  it('parent has no search box and the hook is called without a search term', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'PARENT', id: 'p1' } } as never);
    mockHistory([row({})]);
    render(createElement(AssessmentHistoryPage));
    expect(screen.queryByLabelText('Search assessment history')).toBeNull();
    expect(useAssessmentHistory).toHaveBeenCalledWith({ q: undefined });
  });

  it('shows an empty message when there is no history', () => {
    mockHistory([]);
    render(createElement(AssessmentHistoryPage));
    expect(screen.getByText('No assessment history found.')).toBeInTheDocument();
  });
});