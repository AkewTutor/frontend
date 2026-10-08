import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubjectRankingPage from '@/pages/tutor/SubjectRankingPage';

const mocks = vi.hoisted(() => ({
  subjects: vi.fn(),
  rank: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useSubjects', () => ({ useSubjects: () => mocks.subjects() }));
vi.mock('@/hooks/useTutorProfile', () => ({ useRankSubjects: () => mocks.rank }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.subjects.mockReturnValue({
    data: { subjects: [{ id: 's1', name: 'Algebra', isActive: true }] },
    isLoading: false,
    isError: false,
  });
});

describe('SubjectRankingPage', () => {
  it('sends the ranked selection to useRankSubjects and shows the saved ranking', () => {
    mocks.rank.mutate.mockImplementation((_b, o) =>
      o?.onSuccess?.({ subjects: [{ subjectId: 's1', subjectName: 'Algebra', rank: 1 }] })
    );
    render(<SubjectRankingPage />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Algebra' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mocks.rank.mutate.mock.calls[0][0]).toEqual([{ subjectId: 's1', rank: 1 }]);
    expect(screen.getByRole('status').textContent).toContain('1. Algebra');
  });

  it('shows an error state when subjects fail to load', () => {
    mocks.subjects.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<SubjectRankingPage />);
    expect(screen.getByText(/couldn.t load subjects/i)).toBeInTheDocument();
  });
});
