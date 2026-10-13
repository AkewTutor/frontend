import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SubmitComplaintPage from '@/pages/SubmitComplaintPage';
import { useMyComplaints } from '@/hooks/useComplaints';

vi.mock('@/hooks/useComplaints');
vi.mock('@/components/support/ComplaintForm', () => ({
  default: () => createElement('div', { 'data-testid': 'complaint-form' }),
}));
vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));
vi.mock('@/components/common/StatusBadge', () => ({
  default: ({ status }: { status: string }) =>
    createElement('span', { 'data-testid': 'status-badge' }, status),
}));

const row = (id: string, status = 'OPEN', category = 'SESSION_ISSUE') => ({
  id,
  category,
  status,
  createdAt: '2026-10-01T10:00:00Z',
  resolvedAt: null,
});

const mockList = (complaints: unknown[], total = complaints.length) =>
  vi.mocked(useMyComplaints).mockReturnValue({
    data: { complaints, page: 1, limit: 20, total },
    isLoading: false,
    error: null,
  } as never);

const renderPage = () => render(createElement(SubmitComplaintPage));

describe('SubmitComplaintPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList([row('c1'), row('c2', 'RESOLVED', 'PAYMENT_ISSUE')]);
  });

  it('hosts the form above the caller own complaint history', () => {
    renderPage();
    expect(screen.getByTestId('complaint-form')).toBeInTheDocument();
    expect(screen.getByTestId('complaint-c1')).toBeInTheDocument();
    expect(screen.getByTestId('complaint-c2')).toBeInTheDocument();
    expect(vi.mocked(useMyComplaints)).toHaveBeenLastCalledWith(undefined, 1);
  });

  it('empty history shows a calm empty state', () => {
    mockList([]);
    renderPage();
    expect(screen.getByText('You have not filed any complaints.')).toBeInTheDocument();
    expect(screen.getByTestId('complaint-form')).toBeInTheDocument();
  });

  it('status filter re-queries and resets to page 1', () => {
    mockList([row('c1')], 45);
    renderPage();
    fireEvent.click(screen.getByText('Next'));
    expect(vi.mocked(useMyComplaints)).toHaveBeenLastCalledWith(undefined, 2);
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'RESOLVED' } });
    expect(vi.mocked(useMyComplaints)).toHaveBeenLastCalledWith('RESOLVED', 1);
  });

  it('shows loading and error states', () => {
    vi.mocked(useMyComplaints).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);
    const { unmount } = renderPage();
    expect(screen.getByText('Loading your complaints...')).toBeInTheDocument();
    unmount();
    vi.mocked(useMyComplaints).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('x'),
    } as never);
    renderPage();
    expect(screen.getByText('Could not load your complaints.')).toBeInTheDocument();
  });
});
