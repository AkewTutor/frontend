import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MessagingPage from '@/pages/MessagingPage';
import type { Cohort } from '@/types';

const { useMyCohortsMock } = vi.hoisted(() => ({ useMyCohortsMock: vi.fn() }));

vi.mock('@/hooks/useCohort', () => ({ useMyCohorts: () => useMyCohortsMock() }));
vi.mock('@/components/messaging/MessageThreadView', () => ({
  default: ({ cohortId }: { cohortId: string }) => <div data-testid="thread">{cohortId}</div>,
}));

const cohort = (over: Partial<Cohort> = {}): Cohort => ({
  cohortId: 'c1',
  cohortMembershipId: 'm1',
  format: 'ONE_TO_ONE',
  status: 'ACTIVE',
  targetGroupSize: 1,
  groupFormationWindowExpiresAt: null,
  membershipStatus: 'ACTIVE',
  ...over,
});

function mockCohorts(cohorts: Cohort[]) {
  useMyCohortsMock.mockReturnValue({ data: { cohorts }, isLoading: false, isError: false });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessagingPage', () => {
  it('renders an EmptyState and no thread UI with zero cohorts', () => {
    mockCohorts([]);
    render(<MessagingPage />);
    expect(screen.getByRole('status')).toHaveTextContent('You have no active class yet.');
    expect(screen.queryByTestId('thread')).toBeNull();
  });

  it('ignores cohorts that are not ACTIVE', () => {
    mockCohorts([cohort({ status: 'FORMING' }), cohort({ cohortId: 'c2', status: 'ENDED' })]);
    render(<MessagingPage />);
    expect(screen.getByRole('status')).toHaveTextContent('You have no active class yet.');
  });

  it('skips the picker with exactly one active cohort', () => {
    mockCohorts([cohort({ cohortId: 'c1' }), cohort({ cohortId: 'c9', status: 'ENDED' })]);
    render(<MessagingPage />);
    expect(screen.getByTestId('thread')).toHaveTextContent('c1');
    expect(screen.queryByRole('button', { name: /Class 1/ })).toBeNull();
  });

  it('shows a picker first with several cohorts, then the chosen thread', () => {
    mockCohorts([cohort({ cohortId: 'c1' }), cohort({ cohortId: 'c2', format: 'ONE_TO_THREE' })]);
    render(<MessagingPage />);
    expect(screen.queryByTestId('thread')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Class 2/ }));
    expect(screen.getByTestId('thread')).toHaveTextContent('c2');
    fireEvent.click(screen.getByRole('button', { name: 'Back to conversations' }));
    expect(screen.queryByTestId('thread')).toBeNull();
  });

  it('shows loading and error states', () => {
    useMyCohortsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { unmount } = render(<MessagingPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    unmount();

    useMyCohortsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<MessagingPage />);
    expect(screen.getByText(/couldn.t load your conversations/i)).toBeInTheDocument();
  });
});
