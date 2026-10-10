import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StreakFlame from '@/components/gamification/StreakFlame';

describe('StreakFlame', () => {
  it('shows current and longest streak as independent stats', () => {
    render(
      <StreakFlame
        streak={{ currentStreakDays: 3, longestStreakDays: 12, lastActivityDate: '2026-10-07' }}
        totalXP={4500}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('a reset streak does not change or hide totalXP', () => {
    render(
      <StreakFlame
        streak={{ currentStreakDays: 0, longestStreakDays: 12, lastActivityDate: '2026-09-01' }}
        totalXP={4500}
      />
    );
    expect(screen.getByText('4500')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('has no copy implying lost XP, lost badges or a lost streak', () => {
    const { container } = render(
      <StreakFlame
        streak={{ currentStreakDays: 0, longestStreakDays: 12, lastActivityDate: '2026-09-01' }}
        totalXP={4500}
      />
    );
    expect(container.textContent).not.toMatch(/lost|lose|reset|broke|gone|\bback to\b/i);
  });
});
