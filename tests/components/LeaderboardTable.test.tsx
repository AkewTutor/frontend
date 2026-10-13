import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LeaderboardTable from '@/components/gamification/LeaderboardTable';
import type { LeaderboardEntry } from '@/types';

const rankings: LeaderboardEntry[] = [
  { rank: 1, displayName: 'Abebe K.', xp: 900 },
  { rank: 2, displayName: 'Selam T.', xp: 800 },
  { rank: 3, displayName: 'Hana M.', xp: 700 },
];

describe('LeaderboardTable', () => {
  it('renders displayName exactly as given', () => {
    render(<LeaderboardTable rankings={rankings} callerRank={1} />);
    expect(screen.getByText('Abebe K.')).toBeInTheDocument();
  });

  it('has no lastName prop, so a full name can never be spliced in', () => {
    const { container } = render(
      // @ts-expect-error lastName is deliberately not a prop (privacy-by-design)
      <LeaderboardTable rankings={rankings} callerRank={3} lastName="Mekonnen" />
    );
    expect(container.textContent).not.toContain('Mekonnen');
    expect(screen.getByText('Hana M.')).toBeInTheDocument();
  });

  it('highlights only the caller row (rank === callerRank)', () => {
    render(<LeaderboardTable rankings={rankings} callerRank={3} />);
    expect(screen.getByText('Hana M.').closest('tr')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Abebe K.').closest('tr')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Selam T.').closest('tr')).not.toHaveAttribute('aria-current');
  });

  it('shows an empty state when there are no rankings', () => {
    render(<LeaderboardTable rankings={[]} callerRank={0} />);
    expect(screen.getByText('No rankings yet.')).toBeInTheDocument();
  });
});
