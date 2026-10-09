import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DisputeQueuePage from '@/pages/admin/DisputeQueuePage';
import { useDisputeQueue, useReviewDispute, useResolveDispute } from '@/hooks/useAdminDisputes';
import type { DisputeQueueItem, DisputeDetail } from '@/hooks/useAdminDisputes';

vi.mock('@/hooks/useAdminDisputes');

vi.mock('@/components/admin-support/DisputeCard', () => ({
  default: ({
    complaint,
    onResolve,
    isSubmitting,
  }: {
    complaint: { id: string };
    onResolve: (b: { status: 'RESOLVED'; resolutionNotes: string }) => void;
    isSubmitting?: boolean;
  }) =>
    createElement(
      'div',
      { 'data-testid': 'dispute-card', 'data-submitting': String(!!isSubmitting) },
      createElement('span', null, `card-${complaint.id}`),
      createElement(
        'button',
        { onClick: () => onResolve({ status: 'RESOLVED', resolutionNotes: 'done' }) },
        'mock-resolve'
      )
    ),
}));

vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));

vi.mock('@/components/common/StatusBadge', () => ({
  default: ({ status }: { status: string }) =>
    createElement('span', { 'data-testid': 'status-badge' }, status),
}));

const row = (id: string, over: Partial<DisputeQueueItem> = {}): DisputeQueueItem => ({
  id,
  reporterRole: 'STUDENT',
  category: 'SESSION_ISSUE',
  status: 'OPEN',
  relatedSessionId: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

const mockQueue = (complaints: DisputeQueueItem[], total = complaints.length) =>
  vi.mocked(useDisputeQueue).mockReturnValue({
    data: { complaints, page: 1, limit: 20, total },
    isLoading: false,
    error: null,
  } as never);

const mockDetail = (id: string | null) =>
  vi.mocked(useReviewDispute).mockReturnValue({
    data: id ? ({ id, candidateMemberships: [] } as unknown as DisputeDetail) : undefined,
    isLoading: false,
    error: null,
  } as never);

const mutate = vi.fn();

function LocationProbe() {
  const loc = useLocation();
  return createElement('div', { 'data-testid': 'location' }, loc.pathname);
}

const renderPage = () =>
  render(
    createElement(
      MemoryRouter,
      { initialEntries: ['/admin/disputes'] },
      createElement(DisputeQueuePage),
      createElement(LocationProbe)
    )
  );

describe('DisputeQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueue([row('c1'), row('c2', { status: 'UNDER_REVIEW', category: 'PAYMENT_ISSUE' })]);
    mockDetail(null);
    vi.mocked(useResolveDispute).mockReturnValue({ mutate, isPending: false } as never);
  });

  it('selecting a row drives the detail panel without navigating, queue stays visible', () => {
    renderPage();
    expect(vi.mocked(useReviewDispute)).toHaveBeenLastCalledWith(null);
    expect(screen.queryByTestId('dispute-card')).not.toBeInTheDocument();

    mockDetail('c2');
    fireEvent.click(screen.getByTestId('dispute-row-c2'));

    expect(vi.mocked(useReviewDispute)).toHaveBeenLastCalledWith('c2');
    expect(screen.getByText('card-c2')).toBeInTheDocument();
    expect(screen.getByTestId('dispute-row-c1')).toBeInTheDocument();
    expect(screen.getByTestId('dispute-row-c2')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/disputes');
  });

  it('filters re-query with the new status and category', () => {
    renderPage();
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith(undefined, undefined, 1);

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'OPEN' } });
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith('OPEN', undefined, 1);

    fireEvent.change(screen.getByLabelText('Filter by category'), {
      target: { value: 'PAYMENT_ISSUE' },
    });
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith('OPEN', 'PAYMENT_ISSUE', 1);

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: '' } });
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith(undefined, 'PAYMENT_ISSUE', 1);
  });

  it('empty queue is a calm empty state, not an error', () => {
    mockQueue([]);
    renderPage();
    expect(screen.getByText(/Queue clear/)).toBeInTheDocument();
    expect(screen.queryByText(/Could not load/)).not.toBeInTheDocument();
  });

  it('shows a loading state', () => {
    vi.mocked(useDisputeQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);
    renderPage();
    expect(screen.getByText('Loading disputes...')).toBeInTheDocument();
  });

  it('shows an error state for the queue', () => {
    vi.mocked(useDisputeQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('x'),
    } as never);
    renderPage();
    expect(screen.getByText('Could not load the dispute queue.')).toBeInTheDocument();
  });

  it('onResolve calls the mutation with the selected complaintId added', () => {
    renderPage();
    mockDetail('c1');
    fireEvent.click(screen.getByTestId('dispute-row-c1'));
    fireEvent.click(screen.getByText('mock-resolve'));
    expect(mutate).toHaveBeenCalledWith({
      complaintId: 'c1',
      status: 'RESOLVED',
      resolutionNotes: 'done',
    });
  });

  it('passes the mutation pending state to the card', () => {
    vi.mocked(useResolveDispute).mockReturnValue({ mutate, isPending: true } as never);
    renderPage();
    mockDetail('c1');
    fireEvent.click(screen.getByTestId('dispute-row-c1'));
    expect(screen.getByTestId('dispute-card')).toHaveAttribute('data-submitting', 'true');
  });

  it('paging moves through the queue and a filter change resets to page 1', () => {
    mockQueue([row('c1')], 45);
    renderPage();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();

    fireEvent.click(screen.getByText('Next'));
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith(undefined, undefined, 2);

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'OPEN' } });
    expect(vi.mocked(useDisputeQueue)).toHaveBeenLastCalledWith('OPEN', undefined, 1);
  });
});
