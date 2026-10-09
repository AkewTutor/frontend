import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GroupFormatStatusPage from '@/pages/student/GroupFormatStatusPage';
import type { Cohort, CohortMember } from '@/types';

const { useMyCohortsMock, useCohortMembersMock, useMyMatchRequestsMock } = vi.hoisted(() => ({
  useMyCohortsMock: vi.fn(),
  useCohortMembersMock: vi.fn(),
  useMyMatchRequestsMock: vi.fn(),
}));

vi.mock('@/hooks/useCohort', () => ({
  useMyCohorts: () => useMyCohortsMock(),
  useCohortMembers: (id: string) => useCohortMembersMock(id),
}));
vi.mock('@/hooks/useMatching', () => ({
  useMyMatchRequests: () => useMyMatchRequestsMock(),
}));

const baseCohort: Cohort = {
  cohortId: 'c1',
  cohortMembershipId: 'm1',
  format: 'ONE_TO_THREE',
  status: 'FORMING',
  targetGroupSize: 3,
  groupFormationWindowExpiresAt: null,
  membershipStatus: 'ACTIVE',
};

const member: CohortMember = {
  id: 'u1',
  role: 'TUTOR',
  displayName: 'Selam Tesfaye',
  profilePictureUrl: null,
};

function mockCohorts(cohorts: Cohort[]) {
  useMyCohortsMock.mockReturnValue({
    data: { cohorts },
    isLoading: false,
    isError: false,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <GroupFormatStatusPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useMyMatchRequestsMock.mockReturnValue({
    data: { requests: [] },
    isLoading: false,
    isError: false,
  });
  useCohortMembersMock.mockReturnValue({ data: { members: [member] }, isLoading: false });
});

describe('GroupFormatStatusPage', () => {
  it('derives the active tab from cohort status, with no user action', () => {
    mockCohorts([{ ...baseCohort, status: 'FORMING' }]);
    const { rerender } = renderPage();
    expect(screen.getByRole('tab', { name: 'Waiting' })).toHaveAttribute('aria-selected', 'true');

    mockCohorts([{ ...baseCohort, status: 'ACTIVE' }]);
    rerender(
      <MemoryRouter>
        <GroupFormatStatusPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('tab', { name: 'Assigned' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Selam Tesfaye')).toBeInTheDocument();
  });

  it('treats PENDING_APPROVAL as waiting', () => {
    mockCohorts([{ ...baseCohort, status: 'PENDING_APPROVAL' }]);
    renderPage();
    expect(screen.getByRole('tab', { name: 'Waiting' })).toHaveAttribute('aria-selected', 'true');
  });

  it('has no manual refresh affordance', () => {
    mockCohorts([baseCohort]);
    renderPage();
    expect(screen.queryByRole('button', { name: /refresh|check now/i })).toBeNull();
    expect(screen.queryByText(/refresh|check now/i)).toBeNull();
  });

  it('shows the countdown only when groupFormationWindowExpiresAt is present', () => {
    mockCohorts([baseCohort]);
    const { unmount } = renderPage();
    expect(screen.queryByText(/formation window closes/i)).toBeNull();
    unmount();

    mockCohorts([
      {
        ...baseCohort,
        groupFormationWindowExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ]);
    renderPage();
    expect(screen.getByText(/formation window closes/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no requests and no cohorts', () => {
    mockCohorts([]);
    renderPage();
    expect(screen.getByText('You have no match requests or groups yet.')).toBeInTheDocument();
  });

  it('links to the format switch page', () => {
    mockCohorts([baseCohort]);
    renderPage();
    expect(screen.getByRole('link', { name: 'Request format switch' })).toHaveAttribute(
      'href',
      '/student/format-switch'
    );
  });

  it('treats a 404 on match requests as "no requests", not an error', () => {
    mockCohorts([baseCohort]);
    useMyMatchRequestsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    });
    renderPage();
    expect(screen.queryByText(/couldn.t load/i)).toBeNull();
    expect(screen.getByRole('link', { name: 'Request format switch' })).toBeInTheDocument();
  });

  it('still shows the error line for a non-404 failure', () => {
    mockCohorts([baseCohort]);
    useMyMatchRequestsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 500 } },
    });
    renderPage();
    expect(screen.getByText(/couldn.t load/i)).toBeInTheDocument();
  });
});
