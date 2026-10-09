import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import ProgressPage from '@/pages/student/ProgressPage';
import { useAuth } from '@/hooks/useAuth';
import { useMyCohorts } from '@/hooks/useCohort';
import { useAssessmentsForStudent } from '@/hooks/useWeeklyAssessment';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useCohort');
vi.mock('@/hooks/useWeeklyAssessment');
vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message?: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) =>
    createElement('button', { onClick }, children),
}));

describe('ProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'STUDENT', id: 's1' } } as never);
  });

  it('renders EmptyState for PARENT role', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'PARENT', id: 'p1' } } as never);
    render(createElement(ProgressPage));
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Parent view not supported');
  });

  it('renders EmptyState if no cohorts', () => {
    vi.mocked(useMyCohorts).mockReturnValue({ data: [], isLoading: false } as never);
    render(createElement(ProgressPage));
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No cohorts found.');
  });

  it('selects first cohort by default and fetches assessments', () => {
    vi.mocked(useMyCohorts).mockReturnValue({
      data: [{ id: 'c1', name: 'Math', cohortMembershipId: 'cm1' }],
      isLoading: false,
    } as never);
    vi.mocked(useAssessmentsForStudent).mockReturnValue({
      data: {
        assessments: [
          {
            id: 'a1',
            cohortMembershipId: 'cm1',
            weekStartDate: '2024-01-01',
            tutorFeedback: 'Good',
            createdAt: '2024-01-01',
          },
        ],
      },
      isLoading: false,
    } as never);

    render(createElement(ProgressPage));

    expect(useAssessmentsForStudent).toHaveBeenCalledWith('cm1');
    expect(screen.getByText('Week of: 2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows tabs for multiple cohorts and allows switching', () => {
    vi.mocked(useMyCohorts).mockReturnValue({
      data: [
        { id: 'c1', name: 'Math', cohortMembershipId: 'cm1' },
        { id: 'c2', name: 'Science', cohortMembershipId: 'cm2' },
      ],
      isLoading: false,
    } as never);

    vi.mocked(useAssessmentsForStudent).mockImplementation((id: unknown) => {
      if (id === 'cm1') {
        return {
          data: {
            assessments: [
              {
                id: 'a1',
                cohortMembershipId: 'cm1',
                weekStartDate: '2024-01-01',
                tutorFeedback: 'Math good',
                createdAt: '2024-01-01',
              },
            ],
          },
          isLoading: false,
        } as never;
      }
      if (id === 'cm2') {
        return {
          data: {
            assessments: [
              {
                id: 'a2',
                cohortMembershipId: 'cm2',
                weekStartDate: '2024-01-08',
                tutorFeedback: 'Science good',
                createdAt: '2024-01-01',
              },
            ],
          },
          isLoading: false,
        } as never;
      }
      return { data: { assessments: [] }, isLoading: false } as never;
    });

    render(createElement(ProgressPage));

    expect(screen.getByText('Math good')).toBeInTheDocument();
    expect(screen.queryByText('Science good')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Science'));

    expect(screen.getByText('Science good')).toBeInTheDocument();
    expect(screen.queryByText('Math good')).not.toBeInTheDocument();
  });
});
