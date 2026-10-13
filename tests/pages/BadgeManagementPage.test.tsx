import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BadgeManagementPage from '@/pages/admin/BadgeManagementPage';
import type { AdminBadge } from '@/types';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: { mutate: vi.fn(), isPending: false },
  adjust: { mutate: vi.fn(), isPending: false },
  xp: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useAdminGamification', () => ({
  useAllBadges: (category?: string, page?: number) => mocks.list(category, page),
  useCreateBadge: () => mocks.create,
  useAdjustBadge: () => mocks.adjust,
  useAdjustStudentXP: () => mocks.xp,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const badge: AdminBadge = {
  id: 'b1',
  name: '5-Session Streak',
  category: 'STUDENT',
  criteriaDescription: 'Attended 5 consecutive sessions',
  isActive: true,
};

function setup(badges: AdminBadge[] = [badge]) {
  mocks.list.mockReturnValue({
    data: { badges, page: 1, limit: 20, total: badges.length },
    isLoading: false,
    isError: false,
  });
  render(<BadgeManagementPage />);
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('BadgeManagementPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists badges and starts unfiltered on page 1', () => {
    setup();
    expect(screen.getByText('5-Session Streak')).toBeInTheDocument();
    expect(mocks.list).toHaveBeenLastCalledWith(undefined, 1);
  });

  it('category filter re-queries with the chosen category', () => {
    setup();
    type('Filter by category', 'TUTOR');
    expect(mocks.list).toHaveBeenLastCalledWith('TUTOR', 1);
  });

  it('edit sends only the changed fields', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit 5-Session Streak' }));
    fireEvent.click(screen.getByLabelText('Active'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(mocks.adjust.mutate.mock.calls[0][0]).toEqual({ badgeId: 'b1', isActive: false });
  });

  it('edit save is disabled until something changes', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit 5-Session Streak' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('create form sends name, description, category, criteriaDescription', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Create badge' }));
    type('Name', 'Quarter Champion');
    type('Description', 'Reached a 90-day streak');
    type('Category', 'TUTOR');
    type('Criteria', 'Reach a 90-day streak');
    fireEvent.click(screen.getByRole('button', { name: 'Save badge' }));
    expect(mocks.create.mutate.mock.calls[0][0]).toEqual({
      name: 'Quarter Champion',
      description: 'Reached a 90-day streak',
      category: 'TUTOR',
      criteriaDescription: 'Reach a 90-day streak',
    });
  });

  it('XP adjustment without a note is blocked with a message', () => {
    setup();
    type('Student ID', 's1');
    type('Amount', '-20');
    fireEvent.click(screen.getByRole('button', { name: 'Adjust XP' }));
    expect(mocks.xp.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('A note is required.');
  });

  it('XP adjustment rejects a zero amount', () => {
    setup();
    type('Student ID', 's1');
    type('Amount', '0');
    type('Note', 'Correction');
    fireEvent.click(screen.getByRole('button', { name: 'Adjust XP' }));
    expect(mocks.xp.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('non-zero');
  });

  it('XP adjustment passes the signed amount and note through', () => {
    setup();
    type('Student ID', 's1');
    type('Amount', '-20');
    type('Note', 'Correction');
    fireEvent.click(screen.getByRole('button', { name: 'Adjust XP' }));
    expect(mocks.xp.mutate.mock.calls[0][0]).toEqual({
      studentId: 's1',
      amount: -20,
      note: 'Correction',
    });
  });

  it('shows the empty state and keeps the XP panel when there are no badges', () => {
    setup([]);
    expect(screen.getByText('No badges found.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Adjust student XP' })).toBeInTheDocument();
  });

  it('shows an error instead of crashing on an unexpected response shape', () => {
    mocks.list.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<BadgeManagementPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load badges.');
  });
});
