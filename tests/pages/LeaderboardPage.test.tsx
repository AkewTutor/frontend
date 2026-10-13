import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LeaderboardPage from '@/pages/student/LeaderboardPage';
import { useAuthStore } from '@/store/auth.store';
import type { ParentStudentRelationship, Role } from '@/types';

const mocks = vi.hoisted(() => ({ board: vi.fn(), rels: vi.fn() }));

vi.mock('@/hooks/useGamification', () => ({
  useLeaderboard: (period: string, id?: string) => mocks.board(period, id),
}));
vi.mock('@/hooks/useGuardianship', () => ({ useMyRelationships: () => mocks.rels() }));

const rel = (id: string, studentId: string): ParentStudentRelationship => ({
  id,
  studentId,
  parentId: 'p1',
  status: 'ACTIVE',
  createdAt: '2026-01-05T10:00:00.000Z',
});

function setup(role: Role, relationships: ParentStudentRelationship[] = []) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.board.mockImplementation((period: string) => ({
    data: {
      grade: 5,
      period,
      callerRank: 2,
      rankings: [
        { rank: 1, displayName: 'Sara T.', xp: 900 },
        { rank: 2, displayName: 'Abebe K.', xp: 800 },
      ],
    },
    isLoading: false,
    isError: false,
  }));
  mocks.rels.mockReturnValue({ data: { relationships }, isLoading: false, isError: false });
  render(<LeaderboardPage />);
}

describe('LeaderboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to WEEKLY with no studentId for a Student', () => {
    setup('STUDENT');
    expect(mocks.board).toHaveBeenLastCalledWith('WEEKLY', undefined);
    expect(screen.getByRole('button', { name: 'Weekly' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('period toggle re-queries with MONTHLY', () => {
    setup('STUDENT');
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    expect(mocks.board).toHaveBeenLastCalledWith('MONTHLY', undefined);
    expect(screen.getByRole('button', { name: 'Monthly' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders display names as returned and highlights the caller row', () => {
    setup('STUDENT');
    expect(screen.getByText('Abebe K.')).toBeInTheDocument();
    expect(screen.getByText('Abebe K.').closest('tr')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Sara T.').closest('tr')).not.toHaveAttribute('aria-current');
  });

  it('Parent with one child sends that studentId, no selector', () => {
    setup('PARENT', [rel('r1', 's1')]);
    expect(mocks.board).toHaveBeenLastCalledWith('WEEKLY', 's1');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('Parent with several children: selector options from relationships, switching re-queries, period kept', () => {
    setup('PARENT', [rel('r1', 's1'), rel('r2', 's2')]);
    const values = screen.getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['s1', 's2']);

    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's2' } });
    expect(mocks.board).toHaveBeenLastCalledWith('MONTHLY', 's2');
  });
});
