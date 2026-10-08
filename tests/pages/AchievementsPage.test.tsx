import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AchievementsPage from '@/pages/student/AchievementsPage';
import { useAuthStore } from '@/store/auth.store';
import type { ParentStudentRelationship, Role } from '@/types';

const mocks = vi.hoisted(() => ({ progress: vi.fn(), badges: vi.fn(), rels: vi.fn() }));

vi.mock('@/hooks/useGamification', () => ({
  useMyProgress: (id?: string) => mocks.progress(id),
  useMyBadges: (id?: string) => mocks.badges(id),
}));
vi.mock('@/hooks/useGuardianship', () => ({ useMyRelationships: () => mocks.rels() }));

const rel = (
  id: string,
  studentId: string,
  status: ParentStudentRelationship['status'] = 'ACTIVE'
): ParentStudentRelationship => ({
  id,
  studentId,
  parentId: 'p1',
  status,
  createdAt: '2026-01-05T10:00:00.000Z',
});

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false });

function setup(role: Role, relationships: ParentStudentRelationship[] = [], badges = true) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.progress.mockReturnValue(
    ok({
      totalXP: 4500,
      streak: { currentStreakDays: 0, longestStreakDays: 12, lastActivityDate: '2026-01-01' },
      recentEntries: [],
    })
  );
  mocks.badges.mockReturnValue(
    ok({
      badges: badges
        ? [{ badgeId: 'b1', name: 'First Class', description: 'Attended', earnedAt: '2026-01-02' }]
        : [],
    })
  );
  mocks.rels.mockReturnValue(ok({ relationships }));
  render(<AchievementsPage />);
}

describe('AchievementsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders for Student and for Parent', () => {
    setup('STUDENT');
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByText('First Class')).toBeInTheDocument();
  });

  it('renders for Parent with one linked child', () => {
    setup('PARENT', [rel('r1', 's1')]);
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByText('First Class')).toBeInTheDocument();
  });

  it('Student calls the hooks with no studentId and never loads relationships', () => {
    setup('STUDENT');
    expect(mocks.progress).toHaveBeenCalledWith(undefined);
    expect(mocks.badges).toHaveBeenCalledWith(undefined);
    expect(mocks.rels).not.toHaveBeenCalled();
  });

  it('Parent with one ACTIVE child auto-resolves, no selector', () => {
    setup('PARENT', [rel('r1', 's1')]);
    expect(mocks.progress).toHaveBeenCalledWith('s1');
    expect(mocks.badges).toHaveBeenCalledWith('s1');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('Parent with several children: options come only from own ACTIVE relationships', () => {
    setup('PARENT', [rel('r1', 's1'), rel('r2', 's2'), rel('r3', 's3', 'REVOKED')]);
    const values = screen.getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(['s1', 's2']);
    expect(mocks.progress).toHaveBeenLastCalledWith('s1');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's2' } });
    expect(mocks.progress).toHaveBeenLastCalledWith('s2');
    expect(mocks.badges).toHaveBeenLastCalledWith('s2');
  });

  it('Parent with no ACTIVE child sees an empty state and no gamification request', () => {
    setup('PARENT', [rel('r1', 's1', 'INVITED')]);
    expect(screen.getByText('No linked students yet.')).toBeInTheDocument();
    expect(mocks.progress).not.toHaveBeenCalled();
  });

  it('shows the badge empty state and the XP total', () => {
    setup('STUDENT', [], false);
    expect(screen.getByText('No badges earned yet.')).toBeInTheDocument();
    expect(screen.getByText('4500 XP total')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role: 'STUDENT' } });
    mocks.progress.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mocks.badges.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<AchievementsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
