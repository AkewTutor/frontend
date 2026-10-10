import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformReportsPage from '@/pages/admin/PlatformReportsPage';

const mocks = vi.hoisted(() => ({
  usePlatformHealth: vi.fn(),
  useTutorPerformance: vi.fn(),
  useActivityHistory: vi.fn(),
}));
vi.mock('@/hooks/useAdminReporting', () => mocks);

const health = {
  openDisputes: 4,
  overdueMatchApprovals: 7,
  recordingComplianceEscalations: 3,
  pendingPayoutBatches: 9,
  generatedAt: '2026-09-06T15:00:00Z',
};

const tutor = {
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

const pagination = { page: 1, limit: 20, total: 60, totalPages: 3 };

function renderPage() {
  return render(
    <MemoryRouter>
      <PlatformReportsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.usePlatformHealth.mockReturnValue({ data: health, isLoading: false, isError: false });
  mocks.useTutorPerformance.mockReturnValue({
    data: { tutors: [tutor], pagination },
    isLoading: false,
    isError: false,
  });
  mocks.useActivityHistory.mockReturnValue({
    data: { events: [], pagination },
    isLoading: false,
    isError: false,
  });
});

describe('PlatformReportsPage', () => {
  it('renders sections in order: stats grid, tutor performance, activity history', () => {
    renderPage();

    const stats = screen.getByText('Open disputes');
    const tutors = screen.getByRole('heading', { name: 'Tutor performance' });
    const activity = screen.getByRole('heading', { name: 'Activity history' });

    expect(stats.compareDocumentPosition(tutors) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      tutors.compareDocumentPosition(activity) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('renders all four headline stats plus the last-updated timestamp', () => {
    renderPage();

    for (const [label, value] of [
      ['Open disputes', '4'],
      ['Overdue match approvals', '7'],
      ['Recording compliance escalations', '3'],
      ['Pending payout batches', '9'],
    ]) {
      expect(screen.getByText(label).closest('li')).toHaveTextContent(value);
    }
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it('H5 fix: renders the tutor performance table from useTutorPerformance', () => {
    renderPage();

    expect(mocks.useTutorPerformance).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'uniqueStudentsTaught',
    });
    expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
  });

  it('sort and page changes re-invoke useTutorPerformance with the new params', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'complaintCount' } });
    expect(mocks.useTutorPerformance).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'complaintCount',
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(mocks.useTutorPerformance).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      sortBy: 'complaintCount',
    });
  });

  it('shows a loading state for the stats while the tables still render', () => {
    mocks.usePlatformHealth.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();

    expect(screen.getByText('Loading statistics…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tutor performance' })).toBeInTheDocument();
  });

  it('shows an error for the stats when the health request fails', () => {
    mocks.usePlatformHealth.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load platform statistics.');
  });
});
