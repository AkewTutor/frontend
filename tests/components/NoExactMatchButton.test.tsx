import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoExactMatchButton from '@/components/matching/NoExactMatchButton';

const HOUR = 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

describe('NoExactMatchButton', () => {
  it('computes the countdown from zeroMatchSince and ticks locally every second', () => {
    render(<NoExactMatchButton zeroMatchSince={ago(40 * HOUR)} onTrigger={vi.fn()} />);
    expect(screen.getByText(/8h 0m/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/7h 59m/)).toBeInTheDocument();
    expect(screen.queryByText(/8h 0m/)).toBeNull();
  });

  it('renders the button without a countdown when zeroMatchSince is null', () => {
    render(<NoExactMatchButton zeroMatchSince={null} onTrigger={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText(/Time until automatic escalation/)).toBeNull();
  });

  it('clamps at 0h 0m past 48h and switches the button copy', () => {
    render(<NoExactMatchButton zeroMatchSince={ago(50 * HOUR)} onTrigger={vi.fn()} />);
    expect(screen.getByText(/0h 0m/)).toBeInTheDocument();
    expect(screen.queryByText(/-/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Escalating automatically' })).toBeInTheDocument();
  });

  it('calls onTrigger on click', () => {
    const onTrigger = vi.fn();
    render(<NoExactMatchButton zeroMatchSince={ago(1 * HOUR)} onTrigger={onTrigger} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
