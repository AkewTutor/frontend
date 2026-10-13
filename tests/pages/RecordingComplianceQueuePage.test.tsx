import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import RecordingComplianceQueuePage from '@/pages/admin/RecordingComplianceQueuePage';
import { useComplianceQueue } from '@/hooks/useRecordings';
import type { ComplianceQueueResponse } from '@/hooks/useRecordings';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useRecordings');

vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));

vi.mock('@/components/common/StatusBadge', () => ({
  default: ({ status, severity }: { status: string; severity?: string }) =>
    createElement('div', { 'data-testid': 'status-badge', 'data-severity': severity }, status),
}));

const mockData = (d: Partial<ComplianceQueueResponse> = {}) =>
  vi.mocked(useComplianceQueue).mockReturnValue({
    data: {
      sessions: [],
      page: 1,
      limit: 20,
      total: 0,
      ...d,
    },
    isLoading: false,
    error: null,
  } as never);

const renderPage = () =>
  render(createElement(MemoryRouter, null, createElement(RecordingComplianceQueuePage)));

describe('RecordingComplianceQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData();
  });

  it('shows loading state', () => {
    vi.mocked(useComplianceQueue).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as never);
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useComplianceQueue).mockReturnValue({
      isLoading: false,
      error: new Error('err'),
      data: undefined,
    } as never);
    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Error loading compliance queue.');
  });

  it('empty queue is a clear steady state', () => {
    mockData({ sessions: [], page: 1, limit: 20, total: 0 });
    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Queue clear');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('ESCALATED visually distinguished from MISSING', () => {
    mockData({
      sessions: [
        {
          sessionId: 's1',
          cohortId: 'c1',
          tutorId: 't1',
          scheduledEnd: '2026-10-08T10:00:00Z',
          recordingStatus: 'MISSING',
        },
        {
          sessionId: 's2',
          cohortId: 'c1',
          tutorId: 't1',
          scheduledEnd: '2026-10-08T10:00:00Z',
          recordingStatus: 'ESCALATED',
        },
      ],
      total: 2,
    });
    renderPage();

    const rowMissing = screen.getByTestId('row-s1');
    const rowEscalated = screen.getByTestId('row-s2');

    const badges = screen.getAllByTestId('status-badge');
    expect(badges[0]).toHaveAttribute('data-severity', 'warning');
    expect(badges[0]).toHaveTextContent('MISSING');

    expect(badges[1]).toHaveAttribute('data-severity', 'danger');
    expect(badges[1]).toHaveTextContent('ESCALATED');

    expect(rowEscalated.style.backgroundColor).toContain('var(--color-danger');
    expect(rowMissing.style.backgroundColor).toBe('');
  });

  it('renders all row fields', () => {
    mockData({
      sessions: [
        {
          sessionId: 's123',
          cohortId: 'c456',
          tutorId: 't789',
          scheduledEnd: '2026-10-08T10:00:00Z',
          recordingStatus: 'MISSING',
        },
      ],
      total: 1,
    });
    renderPage();

    expect(screen.getByText('s123')).toBeInTheDocument();
    expect(screen.getByText('c456')).toBeInTheDocument();
    expect(screen.getByText('t789')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-10-08T10:00:00Z').toLocaleString())).toBeInTheDocument();
  });

  it('Next calls the hook with page 2; Previous disabled on page 1', () => {
    mockData({
      sessions: [
        {
          sessionId: 's1',
          cohortId: 'c1',
          tutorId: 't1',
          scheduledEnd: '2026-10-08T10:00:00Z',
          recordingStatus: 'MISSING',
        },
      ],
      total: 30,
      limit: 20,
    });
    renderPage();

    expect(useComplianceQueue).toHaveBeenLastCalledWith(1);

    const prevButton = screen.getByRole('button', { name: 'Previous' });
    const nextButton = screen.getByRole('button', { name: 'Next' });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(useComplianceQueue).toHaveBeenLastCalledWith(2);
  });
});
