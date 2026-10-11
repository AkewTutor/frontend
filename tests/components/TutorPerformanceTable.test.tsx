import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorPerformanceTable from '@/components/admin-support/TutorPerformanceTable';

const mocks = vi.hoisted(() => ({ useTutorPerformance: vi.fn() }));
vi.mock('@/hooks/useAdminReporting', () => ({
  useTutorPerformance: mocks.useTutorPerformance,
}));

const row = {
  tutorId: 't1',
  fullName: 'Abebe Kebede',
  verificationStatus: 'VERIFIED' as const,
  uniqueStudentsTaught: 14,
  activeCohortCount: 3,
  completedSessionCount: 210,
  tutorCausedMissCount: 2,
  badgeCount: 5,
  complaintCount: 1,
  createdAt: '2026-01-10T09:00:00Z',
};

function ok(totalPages = 3, tutors = [row]) {
  return {
    data: { tutors, page: 1, limit: 20, total: totalPages * 20 },
    isLoading: false,
    isError: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useTutorPerformance.mockReturnValue(ok());
});

describe('TutorPerformanceTable', () => {
  it('calls the hook with page 1, limit 20 and the default sort', () => {
    render(<TutorPerformanceTable />);

    expect(mocks.useTutorPerformance).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'uniqueStudentsTaught',
    });
  });

  it('renders a row with every column', () => {
    render(<TutorPerformanceTable />);

    const cells = screen.getByText('Abebe Kebede').closest('tr')!;
    for (const text of ['Verified', '14', '3', '210', '2', '5', '1']) {
      expect(cells).toHaveTextContent(text);
    }
  });

  it('pagination changes only page', () => {
    render(<TutorPerformanceTable />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(mocks.useTutorPerformance).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      sortBy: 'uniqueStudentsTaught',
    });
  });

  it('changing the sort resets page to 1', () => {
    render(<TutorPerformanceTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'badgeCount' } });

    expect(mocks.useTutorPerformance).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'badgeCount',
    });
  });

  it('disables Previous on the first page and Next on the last', () => {
    mocks.useTutorPerformance.mockReturnValue(ok(1));
    render(<TutorPerformanceTable />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows an empty state when there are no tutors', () => {
    mocks.useTutorPerformance.mockReturnValue(ok(1, []));
    render(<TutorPerformanceTable />);

    expect(screen.getByText('No tutors to show yet.')).toBeInTheDocument();
  });

  it('shows loading and error states', () => {
    mocks.useTutorPerformance.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<TutorPerformanceTable />);
    expect(screen.getByText('Loading tutors…')).toBeInTheDocument();

    mocks.useTutorPerformance.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(<TutorPerformanceTable />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load tutor performance.');
  });
});
