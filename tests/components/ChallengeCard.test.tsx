import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ChallengeCard from '@/components/gamification/ChallengeCard';
import type { Challenge } from '@/types';

const challenge: Challenge = {
  id: 'c1',
  title: 'Three assessments',
  period: 'WEEKLY',
  startsAt: '2026-10-12T00:00:00.000Z',
  endsAt: '2026-10-19T00:00:00.000Z',
  targetValue: 5,
};

describe('ChallengeCard', () => {
  it('renders 0 progress when the student has not started (progress undefined)', () => {
    render(<ChallengeCard challenge={challenge} progress={undefined} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).toBeNull();
  });

  it('shows partial progress against the target', () => {
    render(
      <ChallengeCard
        challenge={challenge}
        progress={{ challengeId: 'c1', progressValue: 2, completedAt: null }}
      />
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('a completed challenge is frozen at the target and never overshoots', () => {
    render(
      <ChallengeCard
        challenge={challenge}
        progress={{ challengeId: 'c1', progressValue: 9, completedAt: '2026-10-15T10:00:00.000Z' }}
      />
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('caps an uncompleted overshoot at the target', () => {
    render(
      <ChallengeCard
        challenge={challenge}
        progress={{ challengeId: 'c1', progressValue: 8, completedAt: null }}
      />
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
  });
});
