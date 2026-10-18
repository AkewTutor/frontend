import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyClassesPage from '@/pages/tutor/MyClassesPage';
import { useUpcomingSessions } from '@/hooks/useSessions';

vi.mock('@/hooks/useSessions', () => ({
  useUpcomingSessions: vi.fn(),
}));

const mockUseUpcomingSessions = vi.mocked(useUpcomingSessions);

function renderPage() {
  return render(
    <MemoryRouter>
      <MyClassesPage />
    </MemoryRouter>
  );
}

describe('MyClassesPage', () => {
  it('shows an empty state when the tutor has no classes', () => {
    mockUseUpcomingSessions.mockReturnValue({
      isLoading: false,
      data: { sessions: [], page: 1, limit: 20, total: 0 },
    } as never);
    renderPage();
    expect(screen.getByText('No classes scheduled yet')).toBeInTheDocument();
  });

  it('links each class to Conduct Class and Assessments', () => {
    mockUseUpcomingSessions.mockReturnValue({
      isLoading: false,
      data: {
        sessions: [
          {
            id: 's1',
            cohortId: 'c1',
            scheduledStart: '2026-10-20T10:00:00Z',
            scheduledEnd: '2026-10-20T11:00:00Z',
            status: 'SCHEDULED',
            isMakeup: false,
            recordingStatus: 'PENDING',
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      },
    } as never);
    renderPage();
    expect(screen.getByRole('link', { name: 'Conduct class' })).toHaveAttribute(
      'href',
      '/tutor/conduct-class/s1'
    );
    expect(screen.getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'href',
      '/tutor/assessments/c1'
    );
  });
});
