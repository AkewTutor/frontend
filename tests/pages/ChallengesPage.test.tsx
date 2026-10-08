import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChallengesPage from '@/pages/student/ChallengesPage';
import { useAuthStore } from '@/store/auth.store';
import type { Challenge, ParentStudentRelationship, Role } from '@/types';

const mocks = vi.hoisted(() => ({ active: vi.fn(), mine: vi.fn(), rels: vi.fn() }));

vi.mock('@/hooks/useChallenges', () => ({
  useActiveChallenges: () => mocks.active(),
  useMyChallengeProgress: (id?: string) => mocks.mine(id),
}));
vi.mock('@/hooks/useGuardianship', () => ({ useMyRelationships: () => mocks.rels() }));

const challenge = (id: string, title: string, targetValue: number): Challenge => ({
  id,
  title,
  period: 'WEEKLY',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2026-01-08T00:00:00.000Z',
  targetValue,
});

const rel = (id: string, studentId: string): ParentStudentRelationship => ({
  id,
  studentId,
  parentId: 'p1',
  status: 'ACTIVE',
  createdAt: '2026-01-05T10:00:00.000Z',
});

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false });

function setup(role: Role, relationships: ParentStudentRelationship[] = []) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.rels.mockReturnValue(ok({ relationships }));
  render(<ChallengesPage />);
}

describe('ChallengesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cross-references progress by challengeId; unstarted challenge shows 0', () => {
    mocks.active.mockReturnValue(
      ok({ challenges: [challenge('c1', 'Read 10', 10), challenge('c2', 'Attend 5', 5)] })
    );
    mocks.mine.mockReturnValue(
      ok({ progress: [{ challengeId: 'c1', progressValue: 3, completedAt: null }] })
    );
    setup('STUDENT');
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(mocks.mine).toHaveBeenCalledWith(undefined);
  });

  it('shows the page-level empty state when there are no active challenges', () => {
    mocks.active.mockReturnValue(ok({ challenges: [] }));
    mocks.mine.mockReturnValue(ok({ progress: [] }));
    setup('STUDENT');
    expect(screen.getByText('No active challenges this period.')).toBeInTheDocument();
  });

  it('Parent: auto-resolves one child, selector for several, ids only from relationships', () => {
    mocks.active.mockReturnValue(ok({ challenges: [] }));
    mocks.mine.mockReturnValue(ok({ progress: [] }));
    setup('PARENT', [rel('r1', 's1'), rel('r2', 's2')]);
    const values = screen.getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['s1', 's2']);
    expect(mocks.mine).toHaveBeenLastCalledWith('s1');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's2' } });
    expect(mocks.mine).toHaveBeenLastCalledWith('s2');
  });

  it('shows a loading state while either query is pending', () => {
    mocks.active.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mocks.mine.mockReturnValue(ok({ progress: [] }));
    setup('STUDENT');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
