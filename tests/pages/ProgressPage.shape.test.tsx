import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
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

describe('ProgressPage with real GET /cohorts/me shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'STUDENT', id: 's6' } } as never);
  });

  it('does not crash and uses cohortMembershipId from { cohorts: [...] }', () => {
    vi.mocked(useMyCohorts).mockReturnValue({
      data: { cohorts: [{ cohortId: 'c1', cohortMembershipId: 'cm1' }] },
      isLoading: false,
    } as never);
    vi.mocked(useAssessmentsForStudent).mockReturnValue({
      data: { assessments: [] },
      isLoading: false,
    } as never);
    render(createElement(ProgressPage));
    expect(useAssessmentsForStudent).toHaveBeenCalledWith('cm1');
  });

  it('shows empty state for { cohorts: [] }', () => {
    vi.mocked(useMyCohorts).mockReturnValue({
      data: { cohorts: [] },
      isLoading: false,
    } as never);
    render(createElement(ProgressPage));
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No cohorts found.');
  });
});